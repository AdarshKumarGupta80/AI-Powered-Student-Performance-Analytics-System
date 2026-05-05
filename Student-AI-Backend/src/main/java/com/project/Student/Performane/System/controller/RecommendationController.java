package com.project.Student.Performane.System.controller;


import com.project.Student.Performane.System.dto.RecommendationDTO;
import com.project.Student.Performane.System.service.RecommendationService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/recommendations")
@RequiredArgsConstructor
public class RecommendationController {

    private final RecommendationService recommendationService;

    @GetMapping("/{studentId}")
    public ResponseEntity<List<RecommendationDTO>> getAll(@PathVariable Long studentId) {
        return ResponseEntity.ok(recommendationService.getRecommendations(studentId));
    }

    @GetMapping("/{studentId}/unread")
    public ResponseEntity<List<RecommendationDTO>> getUnread(@PathVariable Long studentId) {
        return ResponseEntity.ok(recommendationService.getUnreadRecommendations(studentId));
    }

    @PutMapping("/{studentId}/mark-read")
    public ResponseEntity<Void> markAllRead(@PathVariable Long studentId) {
        recommendationService.markAllAsRead(studentId);
        return ResponseEntity.ok().build();
    }
}