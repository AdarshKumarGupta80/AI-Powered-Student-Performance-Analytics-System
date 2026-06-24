package com.project.Student.Performane.System.controller;

import com.project.Student.Performane.System.Entity.AiFeedback;
import com.project.Student.Performane.System.service.AiFeedbackService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/ai-feedback")
@RequiredArgsConstructor
public class AiFeedbackController {

    private final AiFeedbackService aiFeedbackService;

    @PostMapping("/generate/{studentId}")
    public ResponseEntity<AiFeedback> generate(@PathVariable Long studentId) throws Exception {
        return ResponseEntity.ok(aiFeedbackService.generateFeedback(studentId));
    }

    @GetMapping("/student/{studentId}")
    public ResponseEntity<List<AiFeedback>> history(@PathVariable Long studentId) {
        return ResponseEntity.ok(aiFeedbackService.getFeedbackHistory(studentId));
    }

    @GetMapping("/dashboard")
    public ResponseEntity<Map<String, Object>> dashboard() {
        return ResponseEntity.ok(aiFeedbackService.getSentimentDashboard());
    }
}
