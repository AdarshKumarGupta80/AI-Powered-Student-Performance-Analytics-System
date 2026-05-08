package com.project.Student.Performane.System.repo;


import com.project.Student.Performane.System.Entity.Feedback;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import java.util.List;

public interface FeedbackRepository extends JpaRepository<Feedback, Long> {
    List<Feedback> findByStudentIdOrderBySubmittedAtDesc(Long studentId);
    List<Feedback> findBySentimentLabelOrderBySubmittedAtDesc(String sentimentLabel);

    @Query("SELECT f.sentimentLabel, COUNT(f) FROM Feedback f GROUP BY f.sentimentLabel")
    List<Object[]> countBySentiment();

    @Query("SELECT AVG(f.rating) FROM Feedback f WHERE f.student.id = :studentId")
    Double avgRatingByStudent(Long studentId);
}