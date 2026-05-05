package com.project.Student.Performane.System.dto;


import lombok.Data;
import java.time.LocalDate;

@Data
public class EngagementLogDTO {
    private LocalDate date;
    private Integer loginCount;
    private Double sessionDurationMinutes;
    private Integer materialsAccessed;
    private Integer doubtSessionsAttended;
    private Double lectureCompletionRate;
}
