package com.project.Student.Performane.System.Entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "weekly_reports")
@Data @NoArgsConstructor @AllArgsConstructor @Builder
public class WeeklyReport {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "student_id", nullable = false)
    private Student student;

    @Column(columnDefinition = "TEXT")
    private String aiAnalysis;

    @Column(columnDefinition = "TEXT")
    private String htmlContent;

    private Double avgScoreSnapshot;
    private Double attendanceSnapshot;
    private String riskLevelSnapshot;
    private LocalDate weekStart;
    private Boolean emailSent;

    private LocalDateTime generatedAt;

    @PrePersist
    public void setTimestamp() { this.generatedAt = LocalDateTime.now(); }
}
