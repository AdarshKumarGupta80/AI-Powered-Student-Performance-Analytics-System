package com.project.Student.Performane.System.repo;


import com.project.Student.Performane.System.Entity.EngagementLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface EngagementLogRepository extends JpaRepository<EngagementLog, Long> {
    @Query("SELECT AVG(e.sessionDurationMinutes) FROM EngagementLog e WHERE e.student.id = :studentId")
    Double findAvgSessionDuration(@Param("studentId") Long studentId);

    @Query("SELECT AVG(e.materialsAccessed) FROM EngagementLog e WHERE e.student.id = :studentId")
    Double findAvgMaterialsAccessed(@Param("studentId") Long studentId);

    @Query("SELECT AVG(e.lectureCompletionRate) FROM EngagementLog e WHERE e.student.id = :studentId")
    Double findAvgLectureCompletion(@Param("studentId") Long studentId);

    @Query("SELECT COUNT(e) FROM EngagementLog e WHERE e.student.id = :studentId")
    Long countLogsByStudentId(@Param("studentId") Long studentId);

}
