package com.project.Student.Performane.System.dto;



import lombok.*;

@Data @AllArgsConstructor @NoArgsConstructor
public class AuthResponse {
    private String token;
    private String email;
    private String role;
    private String name;
    private Long   studentId;
}