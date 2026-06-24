import os, joblib, numpy as np, pandas as pd
from sklearn.linear_model    import LinearRegression, LogisticRegression
from sklearn.ensemble        import RandomForestClassifier
from sklearn.preprocessing   import StandardScaler, LabelEncoder
from sklearn.model_selection import train_test_split
from sklearn.metrics         import mean_absolute_error, r2_score, accuracy_score, classification_report
from data_generator          import generate_training_data

try:
    import torch
    import torch.nn as nn
    import torch.optim as optim
    from torch.utils.data import DataLoader, TensorDataset
    TORCH_AVAILABLE = True
except ImportError:
    TORCH_AVAILABLE = False
    print("PyTorch not installed — DL model disabled")

MODELS_DIR = "models"
FEATURE_COLUMNS = [
    "avg_score", "recent_avg_score", "score_trend", "subject_variance",
    "attendance_percentage", "consecutive_absences", "assignment_completion_rate",
    "weekly_study_hours", "study_consistency_score", "consistency_index",
]

class StudentPerformanceNet(nn.Module):
    """
    3-layer feed-forward network with batch norm + dropout.
    Predicts final score (regression head) and risk category (classification head).
    """
    def __init__(self, input_dim=10, hidden_dim=128, num_risk_classes=3):
        super().__init__()
        self.shared = nn.Sequential(
            nn.Linear(input_dim, hidden_dim),
            nn.BatchNorm1d(hidden_dim),
            nn.ReLU(),
            nn.Dropout(0.3),
            nn.Linear(hidden_dim, 64),
            nn.BatchNorm1d(64),
            nn.ReLU(),
            nn.Dropout(0.2),
        )
        self.score_head = nn.Sequential(
            nn.Linear(64, 32),
            nn.ReLU(),
            nn.Linear(32, 1),
        )
        self.risk_head = nn.Sequential(
            nn.Linear(64, 32),
            nn.ReLU(),
            nn.Linear(32, num_risk_classes),
        )

    def forward(self, x):
        shared_out  = self.shared(x)
        score_out   = self.score_head(shared_out).squeeze(-1)
        risk_logits = self.risk_head(shared_out)
        return score_out, risk_logits


class StudentMLModel:
    def __init__(self):
        self.linear_reg    = None
        self.random_forest = None
        self.logistic_reg  = None
        self.scaler        = StandardScaler()
        self.risk_encoder  = LabelEncoder()
        self.dl_model      = None
        self.dl_scaler     = StandardScaler()
        self.is_trained    = False
        self.metrics       = {}
        os.makedirs(MODELS_DIR, exist_ok=True)

    def train(self, n_samples: int = 5000) -> dict:
        print(f"Generating {n_samples} training samples...")
        df = generate_training_data(n_samples)

        X        = df[FEATURE_COLUMNS].values
        y_score  = df["final_score"].values
        y_risk   = self.risk_encoder.fit_transform(df["risk_level"].values)
        y_passed = df["passed"].values

        X_scaled = self.scaler.fit_transform(X)

        (X_train, X_test,
         ys_train, ys_test,
         yr_train, yr_test,
         yp_train, yp_test) = train_test_split(
            X_scaled, y_score, y_risk, y_passed,
            test_size=0.2, random_state=42
        )

        self.linear_reg = LinearRegression()
        self.linear_reg.fit(X_train, ys_train)
        score_pred_ml = self.linear_reg.predict(X_test)

        self.random_forest = RandomForestClassifier(
            n_estimators=200, max_depth=10,
            min_samples_split=5, random_state=42, class_weight="balanced"
        )
        self.random_forest.fit(X_train, yr_train)

        self.logistic_reg = LogisticRegression(
            max_iter=1000, random_state=42, class_weight="balanced"
        )
        self.logistic_reg.fit(X_train, yp_train)

        dl_metrics = {}
        if TORCH_AVAILABLE:
            print("Training neural network...")
            X_dl    = self.dl_scaler.fit_transform(X)
            X_tr_t  = torch.FloatTensor(X_dl[:int(len(X)*0.8)])
            X_te_t  = torch.FloatTensor(X_dl[int(len(X)*0.8):])
            ys_tr_t = torch.FloatTensor(y_score[:int(len(X)*0.8)])
            ys_te_t = torch.FloatTensor(y_score[int(len(X)*0.8):])
            yr_tr_t = torch.LongTensor(y_risk[:int(len(X)*0.8)])
            yr_te_t = torch.LongTensor(y_risk[int(len(X)*0.8):])

            dataset = TensorDataset(X_tr_t, ys_tr_t, yr_tr_t)
            loader  = DataLoader(dataset, batch_size=64, shuffle=True)

            self.dl_model = StudentPerformanceNet(
                input_dim=len(FEATURE_COLUMNS), hidden_dim=128,
                num_risk_classes=len(self.risk_encoder.classes_)
            )

            optimizer     = optim.Adam(self.dl_model.parameters(), lr=1e-3, weight_decay=1e-4)
            score_loss_fn = nn.MSELoss()
            risk_loss_fn  = nn.CrossEntropyLoss()
            scheduler     = optim.lr_scheduler.StepLR(optimizer, step_size=20, gamma=0.5)

            self.dl_model.train()
            for epoch in range(60):
                epoch_loss = 0
                for xb, ysb, yrb in loader:
                    optimizer.zero_grad()
                    s_pred, r_logits = self.dl_model(xb)
                    loss = score_loss_fn(s_pred, ysb) + risk_loss_fn(r_logits, yrb)
                    loss.backward()
                    optimizer.step()
                    epoch_loss += loss.item()
                scheduler.step()
                if (epoch + 1) % 20 == 0:
                    print(f"  Epoch {epoch+1}/60  loss={epoch_loss/len(loader):.3f}")

            self.dl_model.eval()
            with torch.no_grad():
                s_pred_te, r_logits_te = self.dl_model(X_te_t)
                dl_mae = float(torch.mean(torch.abs(s_pred_te - ys_te_t)))
                r_pred_te = torch.argmax(r_logits_te, dim=1)
                dl_risk_acc = float((r_pred_te == yr_te_t).float().mean())

            dl_metrics = {
                "score_mae":      round(dl_mae, 3),
                "risk_accuracy":  round(dl_risk_acc, 3),
                "architecture":   "3-layer FFN + BatchNorm + Dropout",
                "epochs":         60,
                "hidden_dim":     128,
            }
            print(f"  DL Score MAE : {dl_mae:.3f}")
            print(f"  DL Risk Acc  : {dl_risk_acc:.3f}")
            torch.save(self.dl_model.state_dict(), f"{MODELS_DIR}/dl_model.pt")
            joblib.dump(self.dl_scaler, f"{MODELS_DIR}/dl_scaler.pkl")

        risk_pred = self.random_forest.predict(X_test)
        pass_pred = self.logistic_reg.predict(X_test)

        self.metrics = {
            "score_prediction": {
                "mae": round(mean_absolute_error(ys_test, score_pred_ml), 3),
                "r2":  round(r2_score(ys_test, score_pred_ml), 3),
            },
            "risk_classification": {
                "accuracy": round(accuracy_score(yr_test, risk_pred), 3),
                "report":   classification_report(
                    yr_test, risk_pred,
                    target_names=self.risk_encoder.classes_, output_dict=True
                ),
            },
            "pass_fail":        {"accuracy": round(accuracy_score(yp_test, pass_pred), 3)},
            "deep_learning":    dl_metrics,
            "training_samples": n_samples,
            "feature_columns":  FEATURE_COLUMNS,
        }
        self.is_trained = True
        self._save_models()
        print("Training complete!")
        return self.metrics

    def predict(self, features: dict) -> dict:
        if not self.is_trained:
            raise RuntimeError("Model not trained. Call /train first.")

        fv = np.array([[
            features.get("avgScore",                 0.0),
            features.get("recentAvgScore",           features.get("avgScore", 0.0)),
            features.get("scoreTrend",               0.0),
            features.get("subjectVariance",          0.0),
            features.get("attendancePercentage",     0.0),
            features.get("consecutiveAbsences",      0),
            features.get("assignmentCompletionRate", 100.0),
            features.get("weeklyStudyHours",         0.0),
            features.get("studyConsistencyScore",    50.0),
            features.get("consistencyIndex",         50.0),
        ]])

        X_scaled = self.scaler.transform(fv)

        ml_score   = float(np.clip(self.linear_reg.predict(X_scaled)[0], 0, 100))
        risk_enc   = self.random_forest.predict(X_scaled)[0]
        risk_level = self.risk_encoder.inverse_transform([risk_enc])[0]
        pass_proba = float(self.logistic_reg.predict_proba(X_scaled)[0][1])

        dl_score = ml_score
        dl_available = False
        if TORCH_AVAILABLE and self.dl_model is not None:
            try:
                X_dl = self.dl_scaler.transform(fv)
                x_t  = torch.FloatTensor(X_dl)
                self.dl_model.eval()
                with torch.no_grad():
                    s_pred, r_logits = self.dl_model(x_t)
                dl_score = float(np.clip(s_pred.item(), 0, 100))
                dl_available = True
            except Exception as e:
                print(f"DL prediction error: {e}")

        final_score = (0.6 * ml_score + 0.4 * dl_score) if dl_available else ml_score

        importances   = dict(zip(FEATURE_COLUMNS,
            [round(float(v), 4) for v in self.random_forest.feature_importances_]))
        top_factors   = sorted(importances.items(), key=lambda x: x[1], reverse=True)[:3]

        return {
            "predictedScore":   round(final_score, 2),
            "mlScore":          round(ml_score, 2),
            "dlScore":          round(dl_score, 2) if dl_available else None,
            "dlAvailable":      dl_available,
            "riskLevel":        risk_level,
            "passProbability":  round(pass_proba * 100, 2),
            "willPass":         bool(pass_proba >= 0.5),
            "topRiskFactors":   [f[0] for f in top_factors],
            "confidence": {
                "scoreModel":    self.metrics.get("score_prediction", {}).get("r2", 0),
                "riskModel":     self.metrics.get("risk_classification", {}).get("accuracy", 0),
                "passFailModel": self.metrics.get("pass_fail", {}).get("accuracy", 0),
                "dlScoreMAE":    self.metrics.get("deep_learning", {}).get("score_mae"),
            }
        }

    def _save_models(self):
        joblib.dump(self.linear_reg,    f"{MODELS_DIR}/linear_regression.pkl")
        joblib.dump(self.random_forest, f"{MODELS_DIR}/random_forest.pkl")
        joblib.dump(self.logistic_reg,  f"{MODELS_DIR}/logistic_regression.pkl")
        joblib.dump(self.scaler,        f"{MODELS_DIR}/scaler.pkl")
        joblib.dump(self.risk_encoder,  f"{MODELS_DIR}/risk_encoder.pkl")
        joblib.dump(self.metrics,       f"{MODELS_DIR}/metrics.pkl")
        print("Models saved.")

    def load_models(self) -> bool:
        try:
            self.linear_reg    = joblib.load(f"{MODELS_DIR}/linear_regression.pkl")
            self.random_forest = joblib.load(f"{MODELS_DIR}/random_forest.pkl")
            self.logistic_reg  = joblib.load(f"{MODELS_DIR}/logistic_regression.pkl")
            self.scaler        = joblib.load(f"{MODELS_DIR}/scaler.pkl")
            self.risk_encoder  = joblib.load(f"{MODELS_DIR}/risk_encoder.pkl")
            self.metrics       = joblib.load(f"{MODELS_DIR}/metrics.pkl")
            self.is_trained    = True
            # Try loading DL model
            if TORCH_AVAILABLE:
                dl_path = f"{MODELS_DIR}/dl_model.pt"
                dl_sc_path = f"{MODELS_DIR}/dl_scaler.pkl"
                if os.path.exists(dl_path) and os.path.exists(dl_sc_path):
                    self.dl_scaler = joblib.load(dl_sc_path)
                    self.dl_model  = StudentPerformanceNet(
                        input_dim=len(FEATURE_COLUMNS), hidden_dim=128,
                        num_risk_classes=len(self.risk_encoder.classes_)
                    )
                    self.dl_model.load_state_dict(torch.load(dl_path, weights_only=True))
                    self.dl_model.eval()
                    print("DL model loaded from disk")
            print("All models loaded.")
            return True
        except FileNotFoundError:
            return False


ml_model = StudentMLModel()