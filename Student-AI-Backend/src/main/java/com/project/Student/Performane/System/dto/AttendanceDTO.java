package com.project.Student.Performane.System.dto;


import lombok.Data;

@Data
public class AttendanceDTO {
    private String subject;
    private Integer month;
    private Integer year;
    private Integer classesHeld;
    private Integer classesAttended;
}