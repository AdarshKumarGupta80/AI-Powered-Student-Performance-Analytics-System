package com.project.Student.Performane.System.Entity;


import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "performance_summary")
@Data @NoArgsConstructor @AllArgsConstructor @Builder
public class PerformanceSummary {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "student_id", nullable = false)
    private Student student;

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

    @PrePersist @PreUpdate
    public void setTimestamp() { this.computedAt = LocalDateTime.now(); }
}