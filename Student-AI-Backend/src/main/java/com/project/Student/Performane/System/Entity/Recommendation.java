package com.project.Student.Performane.System.Entity;


import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "recommendations")
@Data @NoArgsConstructor @AllArgsConstructor @Builder
public class Recommendation {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "student_id", nullable = false)
    private Student student;

    @Column(nullable = false)
    private String message;

    private String actionItem;

    @Enumerated(EnumType.STRING)
    private Priority priority;

    @Enumerated(EnumType.STRING)
    private Category category;

    private String triggerReason;

    private Boolean isRead;

    private LocalDateTime generatedAt;

    @PrePersist
    public void prePersist() {
        this.generatedAt = LocalDateTime.now();
        this.isRead = false;
    }

    public enum Priority {
        CRITICAL,
        HIGH,
        MEDIUM,
        LOW
    }

    public enum Category {
        ATTENDANCE,
        ACADEMIC_PERFORMANCE,
        STUDY_HABIT,
        ASSIGNMENT,
        ENGAGEMENT,
        CONSISTENCY,
        MENTAL_HEALTH,
        EXAM_PREPARATION
    }
}