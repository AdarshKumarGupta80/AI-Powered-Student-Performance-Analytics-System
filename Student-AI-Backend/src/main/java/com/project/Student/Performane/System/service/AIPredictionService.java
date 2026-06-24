package com.project.Student.Performane.System.service;


import com.project.Student.Performane.System.dto.PerformanceSummaryDTO;
import lombok.*;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import org.springframework.http.*;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class AIPredictionService {

    private final RestTemplate restTemplate;

    @Value("${ml.service.url:http://localhost:8000}")
    private String mlServiceUrl;

    public Map<String, Object> getPrediction(PerformanceSummaryDTO summary) {
        String url = mlServiceUrl + "/predict";

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);

        Map<String, Object> requestBody = Map.ofEntries(
                Map.entry("studentId", summary.getStudentId()),
                Map.entry("avgScore", orZero(summary.getAvgScore())),
                Map.entry("recentAvgScore", orZero(summary.getRecentAvgScore())),
                Map.entry("scoreTrend", orZero(summary.getScoreTrend())),
                Map.entry("subjectVariance", orZero(summary.getSubjectVariance())),
                Map.entry("attendancePercentage", orZero(summary.getAttendancePercentage())),
                Map.entry("consecutiveAbsences",
                        summary.getConsecutiveAbsences() != null ? summary.getConsecutiveAbsences() : 0),
                Map.entry("assignmentCompletionRate", orZero(summary.getAssignmentCompletionRate())),
                Map.entry("weeklyStudyHours", orZero(summary.getWeeklyStudyHours())),
                Map.entry("studyConsistencyScore", orZero(summary.getStudyConsistencyScore())),
                Map.entry("consistencyIndex", orZero(summary.getConsistencyIndex()))
        );

        HttpEntity<Map<String, Object>> entity = new HttpEntity<>(requestBody, headers);

        try {
            ResponseEntity<Map> response = restTemplate.exchange(
                    url, HttpMethod.POST, entity, Map.class
            );
            return response.getBody();
        } catch (Exception e) {
            return Map.of(
                    "error",          "ML service unavailable: " + e.getMessage(),
                    "predictedScore", 0,
                    "riskLevel",      "UNKNOWN",
                    "passProbability", 0
            );
        }
    }

    private double orZero(Double v) { return v != null ? v : 0.0; }
}