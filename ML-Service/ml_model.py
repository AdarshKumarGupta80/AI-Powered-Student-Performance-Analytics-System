import os
import joblib
import numpy as np
import pandas as pd
from sklearn.linear_model    import LinearRegression, LogisticRegression
from sklearn.ensemble        import RandomForestClassifier
from sklearn.preprocessing   import StandardScaler, LabelEncoder
from sklearn.model_selection import train_test_split
from sklearn.metrics         import (mean_absolute_error, r2_score,
                                     classification_report, accuracy_score)
from data_generator import generate_training_data

MODELS_DIR = "models"
FEATURE_COLUMNS = [
    "avg_score",
    "recent_avg_score",
    "score_trend",
    "subject_variance",
    "attendance_percentage",
    "consecutive_absences",
    "assignment_completion_rate",
    "weekly_study_hours",
    "study_consistency_score",
    "consistency_index",
]


class StudentMLModel:
    """
    Wraps 3 scikit-learn models:
      - linear_reg   : predicts final exam score (regression)
      - random_forest: classifies risk level LOW/MEDIUM/HIGH
      - logistic_reg : predicts pass/fail probability
    """

    def __init__(self):
        self.linear_reg    = None
        self.random_forest = None
        self.logistic_reg  = None
        self.scaler        = StandardScaler()
        self.risk_encoder  = LabelEncoder()
        self.is_trained    = False
        self.metrics       = {}

        os.makedirs(MODELS_DIR, exist_ok=True)


    def train(self, n_samples: int = 2000) -> dict:
        """Generate data, train all 3 models, save to disk, return metrics."""
        print(f"Generating {n_samples} training samples...")
        df = generate_training_data(n_samples)

        X = df[FEATURE_COLUMNS].values
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
        score_pred = self.linear_reg.predict(X_test)

        self.random_forest = RandomForestClassifier(
            n_estimators=200,
            max_depth=10,
            min_samples_split=5,
            random_state=42,
            class_weight="balanced"  
        )
        self.random_forest.fit(X_train, yr_train)
        risk_pred = self.random_forest.predict(X_test)

        self.logistic_reg = LogisticRegression(
            max_iter=1000,
            random_state=42,
            class_weight="balanced"
        )
        self.logistic_reg.fit(X_train, yp_train)
        pass_pred = self.logistic_reg.predict(X_test)

        self.metrics = {
            "score_prediction": {
                "mae":  round(mean_absolute_error(ys_test, score_pred), 3),
                "r2":   round(r2_score(ys_test, score_pred), 3),
            },
            "risk_classification": {
                "accuracy": round(accuracy_score(yr_test, risk_pred), 3),
                "report":   classification_report(
                    yr_test, risk_pred,
                    target_names=self.risk_encoder.classes_,
                    output_dict=True
                ),
            },
            "pass_fail": {
                "accuracy": round(accuracy_score(yp_test, pass_pred), 3),
            },
            "training_samples": n_samples,
            "feature_columns":  FEATURE_COLUMNS,
        }

        self.is_trained = True
        self._save_models()

        print(f" Training complete!")
        print(f"   Score MAE  : {self.metrics['score_prediction']['mae']}")
        print(f"   Score R²   : {self.metrics['score_prediction']['r2']}")
        print(f"   Risk Acc   : {self.metrics['risk_classification']['accuracy']}")
        print(f"   Pass/Fail  : {self.metrics['pass_fail']['accuracy']}")

        return self.metrics


    def predict(self, features: dict) -> dict:
        """
        Takes a feature dict (matching PerformanceSummaryDTO fields),
        returns predicted score, risk level, and pass probability.
        """
        if not self.is_trained:
            raise RuntimeError("Model not trained. Call /train first.")

        feature_vector = np.array([[
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

        X_scaled = self.scaler.transform(feature_vector)

        predicted_score = float(np.clip(
            self.linear_reg.predict(X_scaled)[0], 0, 100
        ))

        risk_encoded    = self.random_forest.predict(X_scaled)[0]
        risk_level      = self.risk_encoder.inverse_transform([risk_encoded])[0]

        pass_proba      = float(self.logistic_reg.predict_proba(X_scaled)[0][1])
        will_pass       = bool(pass_proba >= 0.5)

        importances = dict(zip(
            FEATURE_COLUMNS,
            [round(float(v), 4) for v in self.random_forest.feature_importances_]
        ))
        top_risk_factors = sorted(
            importances.items(), key=lambda x: x[1], reverse=True
        )[:3]

        return {
            "predictedScore":      round(predicted_score, 2),
            "riskLevel":           risk_level,
            "passProbability":     round(pass_proba * 100, 2),
            "willPass":            will_pass,
            "topRiskFactors":      [f[0] for f in top_risk_factors],
            "confidence": {
                "scoreModel":      self.metrics.get("score_prediction", {}).get("r2", 0),
                "riskModel":       self.metrics.get("risk_classification", {}).get("accuracy", 0),
                "passFailModel":   self.metrics.get("pass_fail", {}).get("accuracy", 0),
            }
        }


    def _save_models(self):
        joblib.dump(self.linear_reg,    f"{MODELS_DIR}/linear_regression.pkl")
        joblib.dump(self.random_forest, f"{MODELS_DIR}/random_forest.pkl")
        joblib.dump(self.logistic_reg,  f"{MODELS_DIR}/logistic_regression.pkl")
        joblib.dump(self.scaler,        f"{MODELS_DIR}/scaler.pkl")
        joblib.dump(self.risk_encoder,  f"{MODELS_DIR}/risk_encoder.pkl")
        joblib.dump(self.metrics,       f"{MODELS_DIR}/metrics.pkl")
        print("Models saved to /models")

    def load_models(self) -> bool:
        """Load pre-trained models from disk. Returns True if successful."""
        try:
            self.linear_reg    = joblib.load(f"{MODELS_DIR}/linear_regression.pkl")
            self.random_forest = joblib.load(f"{MODELS_DIR}/random_forest.pkl")
            self.logistic_reg  = joblib.load(f"{MODELS_DIR}/logistic_regression.pkl")
            self.scaler        = joblib.load(f"{MODELS_DIR}/scaler.pkl")
            self.risk_encoder  = joblib.load(f"{MODELS_DIR}/risk_encoder.pkl")
            self.metrics       = joblib.load(f"{MODELS_DIR}/metrics.pkl")
            self.is_trained    = True
            print(" Models loaded from disk")
            return True
        except FileNotFoundError:
            print("  No saved models found — call POST /train first")
            return False


ml_model = StudentMLModel()