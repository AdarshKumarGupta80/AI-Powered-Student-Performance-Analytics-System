package com.project.Student.Performane.System.service;

import lombok.RequiredArgsConstructor;
import okhttp3.*;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.ClassPathResource;
import org.springframework.stereotype.Service;

import jakarta.annotation.PostConstruct;
import tools.jackson.databind.JsonNode;
import tools.jackson.databind.ObjectMapper;

import java.io.IOException;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ChatService {

    @Value("${grok.api.key}")
    private String apiKey;

    private static final String GROK_URL = "https://api.groq.com/openai/v1/chat/completions";
    private static final String MODEL = "llama-3.1-8b-instant";
    private final OkHttpClient http = new OkHttpClient();
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

        Map<String, Object> body = Map.of(
                "model", MODEL,
                "messages", List.of(
                        Map.of(
                                "role", "system",
                                "content", systemPrompt
                        ),
                        Map.of(
                                "role", "user",
                                "content", userMessage
                        )
                ),
                "temperature", 0.3,
                "max_tokens", 512
        );

        RequestBody requestBody = RequestBody.create(
                mapper.writeValueAsString(body),
                MediaType.parse("application/json")
        );

        Request request = new Request.Builder()
                .url(GROK_URL)
                .addHeader("Authorization", "Bearer " + apiKey)
                .addHeader("Content-Type", "application/json")
                .post(requestBody)
                .build();

        try (Response response = http.newCall(request).execute()) {

            if (!response.isSuccessful()) {
                throw new IOException(
                        "Grok API error: "
                                + response.code()
                                + " - "
                                + response.body().string()
                );
            }

            String responseBody = response.body().string();

            JsonNode root = mapper.readTree(responseBody);

            return root
                    .get("choices")
                    .get(0)
                    .get("message")
                    .get("content")
                    .asText();
        }
    }
}