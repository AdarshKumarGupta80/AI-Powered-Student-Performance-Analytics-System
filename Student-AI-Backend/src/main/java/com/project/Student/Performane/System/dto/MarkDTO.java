package com.project.Student.Performane.System.dto;



import com.project.Student.Performane.System.Entity.Mark;
import lombok.Data;
import java.time.LocalDate;

@Data
public class MarkDTO {
    private String subject;
    private Double score;
    private Double maxScore;
    private Mark.ExamType examType;
    private LocalDate examDate;
}