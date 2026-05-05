package com.project.Student.Performane.System.controller;


import com.project.Student.Performane.System.Entity.Student;
import com.project.Student.Performane.System.dto.DashboardDTO;
import com.project.Student.Performane.System.dto.PerformanceSummaryDTO;
import com.project.Student.Performane.System.dto.RecommendationDTO;
import com.project.Student.Performane.System.repo.StudentRepository;
import com.project.Student.Performane.System.service.*;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.*;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/dashboard")
@RequiredArgsConstructor
public class DashboardController {

    private final StudentRepository       studentRepository;
    private final AnalyticsService        analyticsService;
    private final AIPredictionService     aiPredictionService;
    private final RecommendationService   recommendationService;


    @GetMapping("/{studentId}")
    public ResponseEntity<DashboardDTO> getDashboard(@PathVariable Long studentId) {


        Student student = studentRepository.findById(studentId)
                .orElseThrow(() -> new RuntimeException("Student not found: " + studentId));


        PerformanceSummaryDTO analytics = analyticsService.computeAndSave(studentId);

        Map<String, Object> prediction = aiPredictionService.getPrediction(analytics);

        List<RecommendationDTO> allRecs =
                recommendationService.generateAndSave(studentId, analytics, prediction);

        Map<String, List<RecommendationDTO>> grouped = allRecs.stream()
                .collect(Collectors.groupingBy(r -> r.getPriority().name()));

        DashboardDTO dashboard = DashboardDTO.builder()
                .studentId(studentId)
                .studentName(student.getName())
                .department(student.getDepartment())
                .semester(student.getSemester())
                .analytics(analytics)
                .predictedScore(toDouble(prediction.get("predictedScore")))
                .riskLevel(toString(prediction.get("riskLevel")))
                .passProbability(toDouble(prediction.get("passProbability")))
                .willPass(toBool(prediction.get("willPass")))
                .topRiskFactors(toStringList(prediction.get("topRiskFactors")))
                .criticalRecommendations(grouped.getOrDefault("CRITICAL", List.of()))
                .highRecommendations(    grouped.getOrDefault("HIGH",     List.of()))
                .mediumRecommendations(  grouped.getOrDefault("MEDIUM",   List.of()))
                .lowRecommendations(     grouped.getOrDefault("LOW",      List.of()))
                .totalRecommendations((long) allRecs.size())
                .unreadRecommendations((long) allRecs.size())
                .bestSubject(analytics.getBestSubject())
                .weakestSubject(analytics.getWeakestSubject())
                .build();

        return ResponseEntity.ok(dashboard);
    }

    private Double toDouble(Object v) {
        if (v == null) return 0.0;
        return Double.parseDouble(v.toString());
    }
    private String toString(Object v) {
        return v != null ? v.toString() : "UNKNOWN";
    }
    private Boolean toBool(Object v) {
        if (v == null) return false;
        return Boolean.parseBoolean(v.toString());
    }
    @SuppressWarnings("unchecked")
    private List<String> toStringList(Object v) {
        if (v instanceof List) return (List<String>) v;
        return List.of();
    }
}