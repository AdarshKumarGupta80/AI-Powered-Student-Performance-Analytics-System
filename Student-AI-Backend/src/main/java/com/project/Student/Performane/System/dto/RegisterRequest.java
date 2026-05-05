package com.project.Student.Performane.System.dto;



import com.project.Student.Performane.System.Entity.User;
import jakarta.validation.constraints.*;
import lombok.Data;

@Data
public class RegisterRequest {
    @NotBlank private String name;
    @Email @NotBlank private String email;
    @Size(min = 6) private String password;
    private User.Role role = User.Role.STUDENT;
}