package com.project.Student.Performane.System.Entity;


import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDate;

@Entity
@Table(name = "assignments")
@Data @NoArgsConstructor @AllArgsConstructor @Builder
public class Assignment {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "student_id", nullable = false)
    private Student student;

    private String subject;
    private String title;

    private LocalDate dueDate;
    private LocalDate submittedDate;

    private Double score;
    private Double maxScore;

    @Enumerated(EnumType.STRING)
    private SubmissionStatus status;

    public enum SubmissionStatus {
        SUBMITTED_ON_TIME,
        SUBMITTED_LATE,
        NOT_SUBMITTED
    }
    public int getDaysLate() {
        if (submittedDate == null || dueDate == null) return 999;
        return (int) java.time.temporal.ChronoUnit.DAYS.between(dueDate, submittedDate);
    }
}