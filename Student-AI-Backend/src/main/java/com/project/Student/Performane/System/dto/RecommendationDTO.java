package com.project.Student.Performane.System.dto;


import com.project.Student.Performane.System.Entity.Recommendation;
import lombok.*;
import java.time.LocalDateTime;

@Data @NoArgsConstructor @AllArgsConstructor @Builder
public class RecommendationDTO {
    private Long   id;
    private String message;
    private String actionItem;
    private Recommendation.Priority priority;
    private Recommendation.Category category;
    private String triggerReason;
    private Boolean isRead;
    private LocalDateTime generatedAt;
}