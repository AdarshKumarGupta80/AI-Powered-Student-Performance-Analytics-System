package com.project.Student.Performane.System.repo;


import com.project.Student.Performane.System.Entity.AiFeedback;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import java.util.List;

public interface AiFeedbackRepository extends JpaRepository<AiFeedback, Long> {
    List<AiFeedback> findByStudentIdOrderByGeneratedAtDesc(Long studentId);

    @Query("SELECT f.sentimentLabel, COUNT(f) FROM AiFeedback f GROUP BY f.sentimentLabel")
    List<Object[]> countBySentiment();
}
