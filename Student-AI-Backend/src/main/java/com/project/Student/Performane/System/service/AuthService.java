package com.project.Student.Performane.System.service;


import com.project.Student.Performane.System.dto.*;
import com.project.Student.Performane.System.Entity.*;
import com.project.Student.Performane.System.repo.*;
import com.project.Student.Performane.System.security.JwtUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.*;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;


@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository       userRepository;
    private final StudentRepository    studentRepository;
    private final PasswordEncoder      passwordEncoder;
    private final JwtUtil              jwtUtil;
    private final AuthenticationManager authenticationManager;

    public AuthResponse register(RegisterRequest req) {
        if (userRepository.existsByEmail(req.getEmail())) {
            throw new RuntimeException("Email already registered");
        }

        User user = User.builder()
                .name(req.getName())
                .email(req.getEmail())
                .password(passwordEncoder.encode(req.getPassword()))
                .role(req.getRole())
                .build();
        userRepository.save(user);

        Long studentId = null;
        if (req.getRole() == User.Role.STUDENT) {
            Student student = Student.builder()
                    .name(req.getName())
                    .email(req.getEmail())
                    .enrollmentNumber("AUTO-" + System.currentTimeMillis())
                    .department("Not assigned")
                    .semester(1)
                    .user(user)
                    .build();
            Student saved = studentRepository.save(student);
            studentId = saved.getId();
        }

        String token = jwtUtil.generateToken(user.getEmail(), user.getRole().name());
        return new AuthResponse(token, user.getEmail(),
                user.getRole().name(), user.getName(), studentId);
    }

    public AuthResponse login(LoginRequest req) {
        try {
            authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(req.getEmail(), req.getPassword())
            );
        } catch (BadCredentialsException e) {
            throw new RuntimeException("Invalid email or password");
        }

        User user = userRepository.findByEmail(req.getEmail())
                .orElseThrow(() -> new RuntimeException("User not found"));

        Long studentId = null;
        if (user.getRole() == User.Role.STUDENT) {
            studentId = studentRepository.findByEmail(user.getEmail())
                    .map(Student::getId)
                    .orElse(null);
        }

        String token = jwtUtil.generateToken(user.getEmail(), user.getRole().name());
        return new AuthResponse(token, user.getEmail(),
                user.getRole().name(), user.getName(), studentId);
    }
}