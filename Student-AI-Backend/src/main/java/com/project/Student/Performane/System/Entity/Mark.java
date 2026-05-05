package com.project.Student.Performane.System.Entity;


import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDate;

@Entity
@Table(name = "marks")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Mark {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "student_id", nullable = false)
    private Student student;

    @Column(nullable = false)
    private String subject;

    @Column(nullable = false)
    private Double score;

    @Column(nullable = false)
    private Double maxScore;

    @Enumerated(EnumType.STRING)
    private ExamType examType;

    private LocalDate examDate;

    public enum ExamType { MIDTERM, FINAL, ASSIGNMENT, QUIZ }

    public double getPercentage() {
        return (score / maxScore) * 100;
    }
}
