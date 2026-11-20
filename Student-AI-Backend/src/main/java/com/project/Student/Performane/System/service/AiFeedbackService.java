package com.project.Student.Performane.System.service;

import com.project.Student.Performane.System.Entity.AiFeedback;
import com.project.Student.Performane.System.Entity.Student;
import com.project.Student.Performane.System.dto.PerformanceSummaryDTO;
import com.project.Student.Performane.System.repo.AiFeedbackRepository;
import com.project.Student.Performane.System.repo.StudentRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import tools.jackson.databind.JsonNode;
import tools.jackson.databind.ObjectMapper;

import java.io.IOException;
import java.util.HashMap;
import java.util.List;
import java.util.Map;


@Slf4j
@Service
@RequiredArgsConstructor
public class AiFeedbackService {

    private final GeminiClient       gemini;
    private final ObjectMapper       mapper           = new ObjectMapper();
    private final AiFeedbackRepository feedbackRepository;
    private final StudentRepository  studentRepository;
    private final AnalyticsService   analyticsService;


    public AiFeedback generateFeedback(Long studentId) throws IOException {
        Student student = studentRepository.findById(studentId)
                .orElseThrow(() -> new RuntimeException("Student not found: " + studentId));

        PerformanceSummaryDTO summary = analyticsService.getLatestSummary(studentId);

        String feedbackText = callGeminiForFeedback(student, summary);

        SentimentResult sentiment = analyseSentiment(feedbackText, summary.getRiskLevel());

        AiFeedback feedback = AiFeedback.builder()
                .student(student)
                .feedbackText(feedbackText)
                .sentimentLabel(sentiment.label())
                .sentimentScore(sentiment.score())
                .keyThemes(sentiment.themes())
                .aiSummary(sentiment.summary())
                .avgScoreSnapshot(summary.getAvgScore())
                .attendanceSnapshot(summary.getAttendancePercentage())
                .riskLevelSnapshot(summary.getRiskLevel())
                .build();

        return feedbackRepository.save(feedback);
    }

    public List<AiFeedback> getFeedbackHistory(Long studentId) {
        return feedbackRepository.findByStudentIdOrderByGeneratedAtDesc(studentId);
    }

    public Map<String, Object> getSentimentDashboard() {
        List<Object[]> rows = feedbackRepository.countBySentiment();
        Map<String, Long> distribution = new HashMap<>();
        for (Object[] row : rows) {
            distribution.put((String) row[0], (Long) row[1]);
        }
        long total = distribution.values().stream().mapToLong(Long::longValue).sum();
        return Map.of("distribution", distribution, "total", total);
    }

    private String callGeminiForFeedback(Student student, PerformanceSummaryDTO s) throws IOException {
        String systemPrompt = """
                You are an empathetic AI academic coach.
                Based on the student's academic performance data, generate detailed, personalised feedback.
                The feedback must cover:
                - What the student is doing well
                - Key areas that need improvement
                - Specific study habits and behavioural recommendations
                - Emotional encouragement based on their current risk level
                - A motivational closing message
                Be warm, supportive, specific, and data-driven.
                Write directly to the student in second person ("You have...").
                """;

        String userPrompt = String.format("""
                Generate personalised AI feedback for:
                Student: %s | Department: %s | Semester: %d
                
                ACADEMIC DATA:
                - Overall Average: %.1f%% | Recent Average: %.1f%% | Score Trend: %+.1f
                - Best Subject: %s | Weakest Subject: %s
                - Attendance Rate: %.1f%% | Consecutive Absences: %d
                - Assignment Completion: %.1f%% | Assignment Avg Score: %.1f%%
                - Weekly Study Hours: %.1f | Study Consistency: %.1f/100
                - Consistency Index: %.1f | Revision Rate: %.1f%%
                - Risk Level: %s | Risk Score: %.1f
                - At Risk: %s | Sudden Score Drop: %s | Low Engagement: %s
                """,
                student.getName(), student.getDepartment(), student.getSemester(),
                orZ(s.getAvgScore()), orZ(s.getRecentAvgScore()), orZ(s.getScoreTrend()),
                s.getBestSubject(), s.getWeakestSubject(),
                orZ(s.getAttendancePercentage()), orI(s.getConsecutiveAbsences()),
                orZ(s.getAssignmentCompletionRate()), orZ(s.getAssignmentAvgScore()),
                orZ(s.getWeeklyStudyHours()), orZ(s.getStudyConsistencyScore()),
                orZ(s.getConsistencyIndex()), orZ(s.getRevisionRate()),
                s.getRiskLevel(), orZ(s.getRiskScore()),
                s.getAtRiskFlag(), s.getSuddenDropFlag(), s.getLowEngagementFlag()
        );

        return gemini.generate(systemPrompt, userPrompt, 1200);
    }

    private SentimentResult analyseSentiment(String feedbackText, String riskLevel) {
        String systemPrompt = """
                You are a sentiment analysis AI for an educational platform.
                Analyse the student's academic situation described in the feedback and respond ONLY with JSON:
                {
                  "label": "POSITIVE" | "NEGATIVE" | "NEUTRAL" | "MIXED",
                  "score": 0.0-1.0,
                  "themes": "comma,separated,key,themes (max 5)",
                  "summary": "One concise sentence describing the student's academic situation"
                }
                IMPORTANT: Return ONLY the JSON, no markdown, no extra text.
                """;

        String userPrompt = "Risk Level: " + riskLevel + "\nFeedback: " + feedbackText;

        try {
            String raw = gemini.generate(systemPrompt, userPrompt, 300);
            String json = raw.replaceAll("```json|```", "").trim();
            JsonNode result = mapper.readTree(json);
            return new SentimentResult(
                    result.get("label").asText("NEUTRAL"),
                    result.get("score").asDouble(0.5),
                    result.get("themes").asText(""),
                    result.get("summary").asText("")
            );
        } catch (Exception e) {
            log.warn("Sentiment analysis failed: {}", e.getMessage());
            return new SentimentResult("NEUTRAL", 0.5, "performance,academics", "Sentiment analysis unavailable.");
        }
    }

    private double orZ(Double v)  { return v != null ? v : 0.0; }
    private int    orI(Integer v) { return v != null ? v : 0; }

    public record SentimentResult(
            String label,
            double score,
            String themes,
            String summary
    ) {}
}
