package com.project.Student.Performane.System.service;


import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import tools.jackson.databind.JsonNode;
import tools.jackson.databind.ObjectMapper;

import java.io.IOException;

@Service
@RequiredArgsConstructor
public class SentimentAnalysisService {

    private final GeminiClient gemini;
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

        String content = gemini.generate(systemPrompt, userPrompt, 300);

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
