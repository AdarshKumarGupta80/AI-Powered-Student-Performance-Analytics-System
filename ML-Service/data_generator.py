import numpy as np
import pandas as pd

def generate_training_data(n_samples: int = 2000, seed: int = 42) -> pd.DataFrame:
    """
    Generate realistic synthetic student performance data.
    Each row = one student's feature vector + target labels.
    """
    np.random.seed(seed)
    records = []

    for _ in range(n_samples):
        avg_score = np.clip(np.random.normal(60, 18), 10, 100)

        recent_avg = np.clip(avg_score + np.random.normal(0, 8), 10, 100)

        trend = np.clip((recent_avg - avg_score) + np.random.normal(0, 5), -40, 40)

        subject_variance = np.clip(
            np.random.normal(30, 15) + max(0, (60 - avg_score) * 0.5), 0, 120
        )

        attendance = np.clip(np.random.normal(75, 15), 20, 100)

        consec_absences = 0
        if attendance < 65:
            consec_absences = int(np.random.choice([1, 2, 3, 4], p=[0.3, 0.35, 0.25, 0.10]))
        elif attendance < 80:
            consec_absences = int(np.random.choice([0, 1, 2], p=[0.6, 0.3, 0.10]))

        assign_completion = np.clip(np.random.normal(78, 20), 0, 100)
        avg_delay_days    = max(0, np.random.exponential(2))  # most submit on time
        assign_avg_score  = np.clip(avg_score + np.random.normal(2, 8), 0, 100)

       
        weekly_hours = np.clip(
            np.random.normal(8, 4) + (avg_score - 60) * 0.1, 0, 30
        )
        study_consistency = np.clip(np.random.normal(60, 20), 0, 100)
        revision_rate     = np.clip(np.random.normal(40, 20), 0, 100)

        session_duration   = np.clip(np.random.normal(35, 20), 0, 120)
        materials_accessed = np.clip(np.random.normal(3, 2), 0, 15)
        lecture_completion = np.clip(np.random.normal(0.70, 0.20), 0, 1)

        consistency_index = np.clip(
            (max(0, 100 - subject_variance) * 0.40) +
            (study_consistency * 0.30) +
            (attendance * 0.30),
            0, 100
        )

        effort_outcome = (
            min(100.0, (weekly_hours / 20.0) * 100) / avg_score
            if avg_score > 0 else 0.0
        )

        final_score = np.clip(
            avg_score       * 0.30 +
            recent_avg      * 0.20 +
            trend           * 0.50 +
            attendance      * 0.15 +
            assign_completion * 0.10 +
            weekly_hours    * 0.80 +
            consistency_index * 0.10 +
            np.random.normal(0, 5),   # small noise
            0, 100
        )

        risk_score = (
            max(0, 100 - avg_score)   * 0.25 +
            (max(0, -trend) * 3)      * 0.15 +
            max(0, 100 - attendance)  * 0.20 +
            consec_absences * 20      * 0.15 +
            max(0, 100 - assign_completion) * 0.10 +
            max(0, 100 - consistency_index) * 0.15
        )
        if   risk_score >= 65: risk_level = "HIGH"
        elif risk_score >= 35: risk_level = "MEDIUM"
        else:                  risk_level = "LOW"

        passed = int(final_score >= 40 and attendance >= 60)

        records.append({
        
            "avg_score":               round(avg_score, 2),
            "recent_avg_score":        round(recent_avg, 2),
            "score_trend":             round(trend, 2),
            "subject_variance":        round(subject_variance, 2),
            "attendance_percentage":   round(attendance, 2),
            "consecutive_absences":    consec_absences,
            "assignment_completion_rate": round(assign_completion, 2),
            "weekly_study_hours":      round(weekly_hours, 2),
            "study_consistency_score": round(study_consistency, 2),
            "consistency_index":       round(consistency_index, 2),
            # Targets
            "final_score":             round(final_score, 2),
            "risk_level":              risk_level,
            "passed":                  passed,
        })

    return pd.DataFrame(records)


if __name__ == "__main__":
    df = generate_training_data()
    print(df.head())
    print(f"\nShape: {df.shape}")
    print(f"\nRisk distribution:\n{df['risk_level'].value_counts()}")
    print(f"\nPass rate: {df['passed'].mean():.1%}")