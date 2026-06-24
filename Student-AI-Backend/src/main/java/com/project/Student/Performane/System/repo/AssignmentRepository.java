package com.project.Student.Performane.System.repo;



import com.project.Student.Performane.System.Entity.Assignment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface AssignmentRepository extends JpaRepository<Assignment, Long> {
    List<Assignment> findByStudentId(Long studentId);

    @Query("SELECT COUNT(a) FROM Assignment a WHERE a.student.id = :studentId AND a.status != 'NOT_SUBMITTED'")
    Long countSubmittedByStudentId(Long studentId);

    @Query(value = """
        SELECT AVG(DATEDIFF(a.submitted_date, a.due_date))
        FROM assignments a
        WHERE a.student_id = :studentId
          AND a.submitted_date IS NOT NULL
          AND a.submitted_date > a.due_date
        """, nativeQuery = true)
    Double findAvgDelayByStudentId(@Param("studentId") Long studentId);
}