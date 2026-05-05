package com.project.Student.Performane.System.dto;


import lombok.Data;
import java.time.LocalDate;

@Data
public class StudentDTO {
    private String name;
    private String email;
    private String enrollmentNumber;
    private String department;
    private Integer semester;
    private LocalDate dateOfBirth;
}