package com.project.Student.Performane.System.dto;


import lombok.*;
import java.util.List;


@Data @NoArgsConstructor @AllArgsConstructor @Builder
public class DashboardDTO {


    private Long   studentId;
    private String studentName;
    private String department;
    private Integer semester;


    private PerformanceSummaryDTO analytics;

    private Double  predictedScore;
    private String  riskLevel;
    private Double  passProbability;
    private Boolean willPass;
    private List<String> topRiskFactors;

    private List<RecommendationDTO> criticalRecommendations;
    private List<RecommendationDTO> highRecommendations;
    private List<RecommendationDTO> mediumRecommendations;
    private List<RecommendationDTO> lowRecommendations;

    private Long totalRecommendations;
    private Long unreadRecommendations;

    private String bestSubject;
    private String weakestSubject;
}