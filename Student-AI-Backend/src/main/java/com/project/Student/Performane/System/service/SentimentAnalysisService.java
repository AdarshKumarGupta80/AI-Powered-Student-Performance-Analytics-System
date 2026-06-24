package com.project.Student.Performane.System.service;


import lombok.RequiredArgsConstructor;
import okhttp3.*;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import tools.jackson.databind.JsonNode;
import tools.jackson.databind.ObjectMapper;

import java.io.IOException;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class SentimentAnalysisService {

    @Value("${grok.api.key}")
    private String apiKey;

    private static final String GROK_URL = "https://api.groq.com/openai/v1/chat/completions";
    private static final String MODEL     = "llama-3.1-8b-instant";

    private final OkHttpClient http   = new OkHttpClient();
    private final ObjectMapper mapper = new ObjectMapper();

    public record SentimentResult(
            String label,
            double score,
            String themes,
            String summary
    ) {}

    public SentimentResult analyze(String feedbackText, String category) throws IOException {
        String systemPrompt = """
                You are a sentiment analysis AI for an educational platform.
                Analyze the given feedback and respond ONLY with a JSON object (no markdown, no extra text):
                {
                  "label": "POSITIVE" | "NEGATIVE" | "NEUTRAL" | "MIXED",
                  "score": 0.0–1.0 (confidence),
                  "themes": "comma,separated,key,themes (max 4)",
                  "summary": "One concise sentence summarizing the feedback"
                }
                """;

        String userPrompt = "Category: " + category + "\nFeedback: " + feedbackText;

        Map<String, Object> body = Map.of(
                "model",       MODEL,
                "messages",    List.of(
                        Map.of("role", "system", "content", systemPrompt),
                        Map.of("role", "user",   "content", userPrompt)
                ),
                "temperature", 0.1,
                "max_tokens",  300
        );

        RequestBody rb = RequestBody.create(
                mapper.writeValueAsString(body),
                MediaType.parse("application/json")
        );
        Request request = new Request.Builder()
                .url(GROK_URL)
                .addHeader("Authorization", "Bearer " + apiKey)
                .addHeader("Content-Type", "application/json")
                .post(rb).build();

        try (Response response = http.newCall(request).execute()) {
            if (!response.isSuccessful())
                throw new IOException("Groq error " + response.code());

            String raw = response.body().string();
            JsonNode root = mapper.readTree(raw);
            String content = root.get("choices").get(0).get("message").get("content").asText();

            String json = content.replaceAll("```json|```", "").trim();
            JsonNode result = mapper.readTree(json);

            return new SentimentResult(
                    result.get("label").asText("NEUTRAL"),
                    result.get("score").asDouble(0.5),
                    result.get("themes").asText(""),
                    result.get("summary").asText("")
            );
        }
    }
}