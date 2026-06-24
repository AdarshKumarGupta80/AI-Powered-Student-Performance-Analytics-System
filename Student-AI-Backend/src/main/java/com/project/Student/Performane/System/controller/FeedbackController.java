package com.project.Student.Performane.System.controller;


import com.project.Student.Performane.System.Entity.Feedback;
import com.project.Student.Performane.System.service.FeedbackService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/feedback")
@RequiredArgsConstructor
public class FeedbackController {

    private final FeedbackService feedbackService;

    @PostMapping
    public ResponseEntity<Feedback> submit(@RequestBody FeedbackService.FeedbackRequest req) {
        return ResponseEntity.ok(feedbackService.submitFeedback(req));
    }

    @GetMapping("/student/{studentId}")
    public ResponseEntity<List<Feedback>> byStudent(@PathVariable Long studentId) {
        return ResponseEntity.ok(feedbackService.getFeedbackForStudent(studentId));
    }

    @GetMapping("/dashboard")
    public ResponseEntity<Map<String, Object>> dashboard() {
        return ResponseEntity.ok(feedbackService.getSentimentDashboard());
    }
}