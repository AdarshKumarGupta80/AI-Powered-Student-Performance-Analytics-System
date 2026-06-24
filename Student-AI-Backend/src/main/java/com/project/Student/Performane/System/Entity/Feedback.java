package com.project.Student.Performane.System.Entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "feedback")
@Data @NoArgsConstructor @AllArgsConstructor @Builder
public class Feedback {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "student_id")
    private Student student;

    private String submittedBy;
    private String category;

    @Column(columnDefinition = "TEXT")
    private String feedbackText;

    private Integer rating;

    private String sentimentLabel;
    private Double sentimentScore;
    private String keyThemes;
    private String aiSummary;

    private LocalDateTime submittedAt;

    @PrePersist
    public void setTimestamp() { this.submittedAt = LocalDateTime.now(); }
}