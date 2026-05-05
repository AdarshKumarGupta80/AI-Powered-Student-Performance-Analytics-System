package com.project.Student.Performane.System.dto;

import com.project.Student.Performane.System.Entity.Assignment;
import lombok.Data;
import java.time.LocalDate;

@Data
public class AssignmentDTO {
    private String subject;
    private String title;
    private LocalDate dueDate;
    private LocalDate submittedDate;
    private Double score;
    private Double maxScore;
    private Assignment.SubmissionStatus status;
}