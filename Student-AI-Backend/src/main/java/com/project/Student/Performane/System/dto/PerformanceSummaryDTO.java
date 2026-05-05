package com.project.Student.Performane.System.dto;


import lombok.*;
import java.time.LocalDateTime;

@Data @NoArgsConstructor @AllArgsConstructor @Builder
public class PerformanceSummaryDTO {

    private Long studentId;
    private String studentName;


    private Double avgScore;
    private Double recentAvgScore;
    private Double scoreTrend;
    private Double subjectVariance;
    private String bestSubject;
    private String weakestSubject;

    private Double attendancePercentage;
    private Integer consecutiveAbsences;
    private Boolean lowAttendanceFlag;

    private Double assignmentCompletionRate;
    private Double avgSubmissionDelayDays;
    private Double assignmentAvgScore;

    private Double weeklyStudyHours;
    private Double studyConsistencyScore;
    private Double revisionRate;

    private Double avgSessionDurationMinutes;
    private Double avgMaterialsAccessed;
    private Double avgLectureCompletionRate;

    private Double consistencyIndex;
    private Double effortOutcomeRatio;
    private Double riskScore;
    private String riskLevel;
    private Boolean atRiskFlag;
    private Boolean suddenDropFlag;
    private Boolean lowEngagementFlag;

    private LocalDateTime computedAt;
}