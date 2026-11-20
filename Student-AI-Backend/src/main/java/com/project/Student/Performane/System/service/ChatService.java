package com.project.Student.Performane.System.service;

import lombok.RequiredArgsConstructor;
import org.springframework.core.io.ClassPathResource;
import org.springframework.stereotype.Service;

import jakarta.annotation.PostConstruct;
import tools.jackson.databind.ObjectMapper;

import java.io.IOException;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ChatService {

    private final GeminiClient gemini;
    private final ObjectMapper mapper = new ObjectMapper();

    private List<Map<String, Object>> knowledgeBase = new ArrayList<>();

    @PostConstruct
    public void loadKnowledge() {
        try {
            var resource = new ClassPathResource("app-knowledge.json");
            knowledgeBase = mapper.readValue(resource.getInputStream(), List.class);
        } catch (IOException e) {
            System.err.println("Failed to load knowledge base: " + e.getMessage());
        }
    }


    private String retrieveContext(String question) {
        String q = question.toLowerCase();

        return knowledgeBase.stream()
                .filter(entry -> {
                    String content =
                            (entry.get("content") + " " + entry.get("topic"))
                                    .toLowerCase();

                    return Arrays.stream(q.split("\\s+"))
                            .filter(word -> word.length() > 3)
                            .anyMatch(content::contains);
                })
                .map(entry ->
                        "• " + entry.get("topic") + ": " + entry.get("content"))
                .collect(Collectors.joining("\n\n"));
    }

    public String chat(String userMessage) throws IOException {
        String context = retrieveContext(userMessage);

        if (context.isEmpty()) {
            context = knowledgeBase.stream()
                    .map(e ->
                            "• " + e.get("topic") + ": " + e.get("content"))
                    .collect(Collectors.joining("\n\n"));
        }

        String systemPrompt = """
                You are a helpful assistant for the StudentAI web application.

                You ONLY answer questions about this application:
                - features
                - navigation
                - dashboard usage
                - reports
                - analytics
                - login/help issues

                If the question is unrelated, politely redirect the user.

                Keep responses concise and practical.

                APP KNOWLEDGE BASE:
                """ + context;

        return gemini.generate(systemPrompt, userMessage, 512);
    }
}
