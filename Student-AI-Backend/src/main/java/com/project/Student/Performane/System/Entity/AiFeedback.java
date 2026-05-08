package com.project.Student.Performane.System.Entity;


import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;


@Entity
@Table(name = "ai_feedback")
@Data @NoArgsConstructor @AllArgsConstructor @Builder
public class AiFeedback {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "student_id", nullable = false)
    private Student student;

    @Column(columnDefinition = "TEXT")
    private String feedbackText;

    private String sentimentLabel;
    private Double sentimentScore;

    private String keyThemes;

    private String aiSummary;

    private Double avgScoreSnapshot;
    private Double attendanceSnapshot;
    private String riskLevelSnapshot;

    private LocalDateTime generatedAt;

    @PrePersist
    public void setTimestamp() { this.generatedAt = LocalDateTime.now(); }
}
