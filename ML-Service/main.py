import os
import threading
from fastapi        import FastAPI, HTTPException
from pydantic       import BaseModel, Field
from contextlib     import asynccontextmanager
from typing         import Optional, List
from ml_model       import ml_model
from fastapi.middleware.cors import CORSMiddleware

# Tracks whether startup training is complete
_startup_done = False

@asynccontextmanager
async def lifespan(app: FastAPI):
    global _startup_done

    def _load_or_train():
        global _startup_done
        print("Starting ML Service...")
        loaded = ml_model.load_models()
        if not loaded:
            print(" No saved models found — training fresh models with 5000 samples...")
            ml_model.train(n_samples=5000)
        else:
            print("Models loaded from disk successfully")
        _startup_done = True

    # Run training in background so the HTTP server starts immediately
    # This lets /health return 200 during cold-start instead of timing out
    thread = threading.Thread(target=_load_or_train, daemon=True)
    thread.start()

    yield
    print(" ML Service shutting down")


app = FastAPI(
    title="Student Performance ML Service",
    description="Predicts student scores, risk level, and pass/fail probability",
    version="1.0.0",
    lifespan=lifespan
)


app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],      
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)



class PredictionRequest(BaseModel):
    """Matches the PerformanceSummaryDTO fields from Spring Boot"""
    studentId:                  Optional[int]   = None
    avgScore:                   float           = Field(default=0.0,   ge=0, le=100)
    recentAvgScore:             Optional[float] = Field(default=None,  ge=0, le=100)
    scoreTrend:                 float           = Field(default=0.0)
    subjectVariance:            float           = Field(default=0.0,   ge=0)
    attendancePercentage:       float           = Field(default=0.0,   ge=0, le=100)
    consecutiveAbsences:        int             = Field(default=0,     ge=0)
    assignmentCompletionRate:   float           = Field(default=100.0, ge=0, le=100)
    weeklyStudyHours:           float           = Field(default=0.0,   ge=0)
    studyConsistencyScore:      float           = Field(default=50.0,  ge=0, le=100)
    consistencyIndex:           float           = Field(default=50.0,  ge=0, le=100)

    class Config:
        extra = "ignore"


class PredictionResponse(BaseModel):
    studentId:       Optional[int]
    predictedScore:  float
    riskLevel:       str
    passProbability: float
    willPass:        bool
    topRiskFactors:  List[str]
    confidence:      dict


class TrainRequest(BaseModel):
    n_samples: int = Field(default=5000, ge=500, le=50000)


class BatchPredictionItem(BaseModel):
    studentId:                  Optional[int]   = None
    avgScore:                   float           = Field(default=0.0,   ge=0, le=100)
    recentAvgScore:             Optional[float] = Field(default=None,  ge=0, le=100)
    scoreTrend:                 float           = Field(default=0.0)
    subjectVariance:            float           = Field(default=0.0,   ge=0)
    attendancePercentage:       float           = Field(default=0.0,   ge=0, le=100)
    consecutiveAbsences:        int             = Field(default=0,     ge=0)
    assignmentCompletionRate:   float           = Field(default=100.0, ge=0, le=100)
    weeklyStudyHours:           float           = Field(default=0.0,   ge=0)
    studyConsistencyScore:      float           = Field(default=50.0,  ge=0, le=100)
    consistencyIndex:           float           = Field(default=50.0,  ge=0, le=100)

    class Config:
        extra = "ignore"



def safe_features(features: dict) -> dict:
    """
    Ensures all numeric features are proper floats.
    Prevents crashes from Integer/None values coming from Spring Boot.
    """
    def to_float(v, default=0.0):
        if v is None:
            return default
        try:
            return float(v)
        except (TypeError, ValueError):
            return default

    def to_int(v, default=0):
        if v is None:
            return default
        try:
            return int(v)
        except (TypeError, ValueError):
            return default

    avg = to_float(features.get("avgScore"), 0.0)

    return {
        "avgScore":                 avg,
        "recentAvgScore":           to_float(features.get("recentAvgScore"), avg),
        "scoreTrend":               to_float(features.get("scoreTrend"), 0.0),
        "subjectVariance":          to_float(features.get("subjectVariance"), 0.0),
        "attendancePercentage":     to_float(features.get("attendancePercentage"), 0.0),
        "consecutiveAbsences":      to_int(features.get("consecutiveAbsences"), 0),
        "assignmentCompletionRate": to_float(features.get("assignmentCompletionRate"), 100.0),
        "weeklyStudyHours":         to_float(features.get("weeklyStudyHours"), 0.0),
        "studyConsistencyScore":    to_float(features.get("studyConsistencyScore"), 50.0),
        "consistencyIndex":         to_float(features.get("consistencyIndex"), 50.0),
    }




@app.get("/")
@app.head("/")
def root():
    """Root endpoint — useful for Railway health checks"""
    return {
        "service": "Student Performance ML Service",
        "version": "1.0.0",
        "status":  "running",
        "trained": ml_model.is_trained,
        "docs":    "/docs",
    }


@app.get("/health")
@app.head("/health")
def health():
    """
    Health check — always returns HTTP 200 immediately, even during cold-start training.
    UptimeRobot / Render will never get a 503 from this endpoint.
    """
    return {
        "status":  "ok",
        "ready":   _startup_done,   # false while model is still training on cold start
        "trained": ml_model.is_trained,
        "port":    int(os.environ.get("PORT", 8000)),
    }


@app.get("/model-info")
def model_info():
    """Returns training metrics and feature column names."""
    if not ml_model.is_trained:
        raise HTTPException(
            status_code=503,
            detail="Models not trained yet. Call POST /train first."
        )
    return {
        "metrics": ml_model.metrics,
        "featureColumns": [
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
        ],
    }


@app.post("/train")
def train(req: TrainRequest):
    """
    Train all 3 models with fresh synthetic data and save to disk.
    Call this:
      - Once after first deploy
      - Any time you want to retrain with more data
    Models are saved to /models and reloaded automatically on restart.
    """
    print(f" Training with {req.n_samples} samples...")
    try:
        metrics = ml_model.train(n_samples=req.n_samples)
        return {
            "message":  "Models trained and saved successfully",
            "samples":  req.n_samples,
            "metrics":  metrics,
        }
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Training failed: {str(e)}"
        )


@app.post("/predict", response_model=PredictionResponse)
def predict(req: PredictionRequest):
    """
    Main prediction endpoint — called by Spring Boot after every analytics computation.

    Input:  PerformanceSummaryDTO fields from Spring Boot
    Output: predictedScore, riskLevel, passProbability, willPass, topRiskFactors
    """
    if not ml_model.is_trained:
        raise HTTPException(
            status_code=503,
            detail="Models not trained. Call POST /train first."
        )

    try:
        features = safe_features(req.model_dump())

        result = ml_model.predict(features)

        return PredictionResponse(
            studentId=req.studentId,
            predictedScore=result["predictedScore"],
            riskLevel=result["riskLevel"],
            passProbability=result["passProbability"],
            willPass=result["willPass"],
            topRiskFactors=result["topRiskFactors"],
            confidence=result["confidence"],
        )

    except Exception as e:
        print(f" Prediction error: {str(e)}")
        return PredictionResponse(
            studentId=req.studentId,
            predictedScore=0.0,
            riskLevel="UNKNOWN",
            passProbability=0.0,
            willPass=False,
            topRiskFactors=[],
            confidence={
                "scoreModel":    0.0,
                "riskModel":     0.0,
                "passFailModel": 0.0,
            },
        )


@app.post("/predict/batch")
def predict_batch(requests: List[BatchPredictionItem]):
    """
    Predict for multiple students in one call.
    Used by the Predictions page to load all students at once.
    """
    if not ml_model.is_trained:
        raise HTTPException(
            status_code=503,
            detail="Models not trained. Call POST /train first."
        )

    results = []
    for req in requests:
        try:
            features = safe_features(req.model_dump())
            result   = ml_model.predict(features)
            results.append({
                "studentId":       req.studentId,
                "predictedScore":  result["predictedScore"],
                "riskLevel":       result["riskLevel"],
                "passProbability": result["passProbability"],
                "willPass":        result["willPass"],
                "topRiskFactors":  result["topRiskFactors"],
                "confidence":      result["confidence"],
            })
        except Exception as e:
            print(f"Batch prediction error for student {req.studentId}: {str(e)}")
            results.append({
                "studentId":       req.studentId,
                "predictedScore":  0.0,
                "riskLevel":       "UNKNOWN",
                "passProbability": 0.0,
                "willPass":        False,
                "topRiskFactors":  [],
                "confidence":      {},
                "error":           str(e),
            })

    return results


@app.delete("/models")
def delete_models():
    """
    Delete all saved model files and reset training state.
    Useful for forcing a full retrain from scratch.
    """
    import shutil
    try:
        if os.path.exists("models"):
            shutil.rmtree("models")
            os.makedirs("models")
        ml_model.is_trained = False
        return {"message": "Models deleted. Call POST /train to retrain."}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


if __name__ == "__main__":
    import uvicorn
    port = int(os.environ.get("PORT", 8000))
    print(f" Starting on port {port}")
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=port,
        reload=False,   
    )