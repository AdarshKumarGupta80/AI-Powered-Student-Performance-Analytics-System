package com.project.Student.Performane.System.service;

import lombok.extern.slf4j.Slf4j;
import okhttp3.MediaType;
import okhttp3.OkHttpClient;
import okhttp3.Request;
import okhttp3.RequestBody;
import okhttp3.Response;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import tools.jackson.databind.JsonNode;
import tools.jackson.databind.ObjectMapper;

import java.io.IOException;
import java.util.List;
import java.util.Map;
import java.util.concurrent.TimeUnit;

@Slf4j
@Component
public class GeminiClient {

    private static final String BASE_URL =
            "https://generativelanguage.googleapis.com/v1beta/models/";
    private static final MediaType JSON = MediaType.parse("application/json");

    @Value("${gemini.api.key:}")
    private String apiKey;

    @Value("${gemini.model:gemini-3.5-flash-lite}")
    private String model;

    private final OkHttpClient http = new OkHttpClient.Builder()
            .connectTimeout(15, TimeUnit.SECONDS)
            .writeTimeout(30, TimeUnit.SECONDS)
            .readTimeout(90, TimeUnit.SECONDS)
            .build();
    private final ObjectMapper mapper = new ObjectMapper();

    public String generate(String systemPrompt, String userPrompt, int maxOutputTokens)
            throws IOException {

        if (apiKey == null || apiKey.isBlank()) {
            throw new IOException("Gemini API key is not configured (set GEMINI_API_KEY)");
        }

        Map<String, Object> systemInstruction =
                Map.of("parts", List.of(Map.of("text", systemPrompt)));
        Map<String, Object> userContent =
                Map.of("role", "user", "parts", List.of(Map.of("text", userPrompt)));
        Map<String, Object> generationConfig =
                Map.of("maxOutputTokens", maxOutputTokens);

        Map<String, Object> body = Map.of(
                "systemInstruction", systemInstruction,
                "contents",          List.of(userContent),
                "generationConfig",  generationConfig
        );

        Request request = new Request.Builder()
                .url(BASE_URL + model + ":generateContent")
                .addHeader("x-goog-api-key", apiKey)
                .addHeader("Content-Type", "application/json")
                .post(RequestBody.create(mapper.writeValueAsString(body), JSON))
                .build();

        try (Response response = http.newCall(request).execute()) {
            String raw = response.body() != null ? response.body().string() : "";
            if (!response.isSuccessful()) {
                throw new IOException("Gemini error: " + response.code() + " " + raw);
            }
            return extractText(mapper.readTree(raw));
        }
    }

    private String extractText(JsonNode root) throws IOException {
        JsonNode candidates = root.get("candidates");
        if (candidates == null || candidates.size() == 0) {
            throw new IOException("Gemini returned no candidates (promptFeedback="
                    + root.get("promptFeedback") + ")");
        }

        JsonNode candidate = candidates.get(0);
        JsonNode content   = candidate.get("content");
        JsonNode parts     = content != null ? content.get("parts") : null;

        StringBuilder text = new StringBuilder();
        if (parts != null) {
            for (int i = 0; i < parts.size(); i++) {
                JsonNode part = parts.get(i);
                JsonNode thought = part.get("thought");
                if (thought != null && "true".equals(thought.asText())) {
                    continue;
                }
                JsonNode t = part.get("text");
                if (t != null) {
                    text.append(t.asText());
                }
            }
        }

        JsonNode fr = candidate.get("finishReason");
        String finishReason = fr != null ? fr.asText() : "";

        if (text.length() == 0) {
            throw new IOException("Gemini returned empty text (finishReason=" + finishReason + ")");
        }
        if ("MAX_TOKENS".equals(finishReason)) {
            log.warn("Gemini response truncated (finishReason=MAX_TOKENS); consider a higher maxOutputTokens");
        }
        return text.toString();
    }
}
