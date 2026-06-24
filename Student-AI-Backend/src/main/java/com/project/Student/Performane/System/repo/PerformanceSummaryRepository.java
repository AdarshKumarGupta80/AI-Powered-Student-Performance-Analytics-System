package com.project.Student.Performane.System.repo;


import com.project.Student.Performane.System.Entity.PerformanceSummary;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;

public interface PerformanceSummaryRepository extends JpaRepository<PerformanceSummary, Long> {
    Optional<PerformanceSummary> findTopByStudentIdOrderByComputedAtDesc(Long studentId);
}