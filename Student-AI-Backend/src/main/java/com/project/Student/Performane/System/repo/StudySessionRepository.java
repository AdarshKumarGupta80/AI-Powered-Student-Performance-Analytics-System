package com.project.Student.Performane.System.repo;


import com.project.Student.Performane.System.Entity.StudySession;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface StudySessionRepository extends JpaRepository<StudySession, Long> {
    List<StudySession> findByStudentId(Long studentId);

    @Query("SELECT SUM(s.hoursStudied) FROM StudySession s WHERE s.student.id = :studentId")
    Double findTotalHoursByStudentId(@Param("studentId") Long studentId);

    @Query("SELECT COUNT(DISTINCT s.date) FROM StudySession s WHERE s.student.id = :studentId")
    Long countDistinctStudyDays(@Param("studentId") Long studentId);
}