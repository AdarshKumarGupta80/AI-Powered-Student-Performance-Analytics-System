package com.project.Student.Performane.System.repo;


import com.project.Student.Performane.System.Entity.Attendance;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface AttendanceRepository extends JpaRepository<Attendance, Long> {
    List<Attendance> findByStudentId(Long studentId);

    @Query("SELECT SUM(a.classesAttended) * 100.0 / SUM(a.classesHeld) FROM Attendance a WHERE a.student.id = :studentId")
    Double findOverallAttendanceByStudentId(@Param("studentId") Long studentId);
}