package com.project.Student.Performane.System.repo;


import com.project.Student.Performane.System.Entity.Mark;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface MarkRepository extends JpaRepository<Mark, Long> {
    List<Mark> findByStudentId(Long studentId);
    List<Mark> findByStudentIdAndSubject(Long studentId, String subject);

    @Query("SELECT AVG(m.score / m.maxScore * 100) FROM Mark m WHERE m.student.id = :studentId")
    Double findAverageScoreByStudentId(@Param("studentId") Long studentId);
}