package com.project.Student.Performane.System.controller;


import com.project.Student.Performane.System.dto.PerformanceSummaryDTO;
import com.project.Student.Performane.System.service.AIPredictionService;
import com.project.Student.Performane.System.service.AnalyticsService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/analytics")
@RequiredArgsConstructor
public class AnalyticsController {

    private final AnalyticsService analyticsService;


    @PostMapping("/compute/{studentId}")
    public ResponseEntity<PerformanceSummaryDTO> compute(@PathVariable Long studentId) {
        return ResponseEntity.ok(analyticsService.computeAndSave(studentId));
    }

    private final AIPredictionService aiPredictionService;


    @GetMapping("/predict/{studentId}")
    public ResponseEntity<Map<String, Object>> predict(@PathVariable Long studentId) {
        PerformanceSummaryDTO summary = analyticsService.getLatestSummary(studentId);
        Map<String, Object> prediction = aiPredictionService.getPrediction(summary);
        return ResponseEntity.ok(Map.of(
                "studentId",  studentId,
                "features",   summary,
                "prediction", prediction
        ));
    }

    @GetMapping("/{studentId}")
    public ResponseEntity<PerformanceSummaryDTO> getSummary(@PathVariable Long studentId) {
        return ResponseEntity.ok(analyticsService.getLatestSummary(studentId));
    }
}