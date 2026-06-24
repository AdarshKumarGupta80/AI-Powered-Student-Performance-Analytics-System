package com.project.Student.Performane.System.Entity;


import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDate;

@Entity
@Table(name = "engagement_logs")
@Data @NoArgsConstructor @AllArgsConstructor @Builder
public class EngagementLog {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "student_id", nullable = false)
    private Student student;

    private LocalDate date;
    private Integer loginCount;
    private Double sessionDurationMinutes;
    private Integer materialsAccessed;
    private Integer doubtSessionsAttended;
    private Double lectureCompletionRate;
}