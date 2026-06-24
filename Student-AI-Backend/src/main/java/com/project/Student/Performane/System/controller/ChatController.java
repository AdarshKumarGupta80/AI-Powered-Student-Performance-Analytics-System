package com.project.Student.Performane.System.controller;
import com.project.Student.Performane.System.service.ChatService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/chat")
@RequiredArgsConstructor
public class ChatController {

    private final ChatService chatService;

    @PostMapping
    public ResponseEntity<Map<String, String>> chat(@RequestBody Map<String, String> req) {
        try {
            String reply = chatService.chat(req.get("message"));
            return ResponseEntity.ok(Map.of("reply", reply));
        } catch (Exception e) {
            return ResponseEntity.internalServerError()
                    .body(Map.of("reply", "Sorry, I'm having trouble right now. Please try again."));
        }
    }
}
