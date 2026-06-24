package com.project.Student.Performane.System.repo;

import com.project.Student.Performane.System.Entity.WeeklyReport;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;

public interface WeeklyReportRepository extends JpaRepository<WeeklyReport, Long> {
    List<WeeklyReport> findByStudentIdOrderByGeneratedAtDesc(Long studentId);
    Optional<WeeklyReport> findTopByStudentIdOrderByGeneratedAtDesc(Long studentId);
}
