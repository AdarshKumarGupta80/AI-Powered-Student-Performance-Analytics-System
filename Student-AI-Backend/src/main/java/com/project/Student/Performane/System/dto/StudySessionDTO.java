package com.project.Student.Performane.System.dto;


import lombok.Data;
import java.time.LocalDate;

@Data
public class StudySessionDTO {
    private String subject;
    private LocalDate date;
    private Double hoursStudied;
    private Boolean revisionSession;
}
