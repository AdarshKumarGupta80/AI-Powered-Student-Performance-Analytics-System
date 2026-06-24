package com.project.Student.Performane.System.repo;

import com.project.Student.Performane.System.Entity.Recommendation;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.transaction.annotation.Transactional;
import java.util.List;

public interface RecommendationRepository extends JpaRepository<Recommendation, Long> {

    List<Recommendation> findByStudentIdOrderByPriorityAscGeneratedAtDesc(Long studentId);

    List<Recommendation> findByStudentIdAndIsReadFalseOrderByPriorityAsc(Long studentId);

    @Modifying
    @Transactional
    @Query("DELETE FROM Recommendation r WHERE r.student.id = :studentId")
    void deleteAllByStudentId(@Param("studentId") Long studentId);

    @Query("SELECT COUNT(r) FROM Recommendation r WHERE r.student.id = :studentId AND r.isRead = false")
    Long countUnreadByStudentId(@Param("studentId") Long studentId);
}