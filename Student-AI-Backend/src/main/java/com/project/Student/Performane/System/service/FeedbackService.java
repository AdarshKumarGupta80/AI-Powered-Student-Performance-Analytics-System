package com.project.Student.Performane.System.service;

import com.project.Student.Performane.System.Entity.Feedback;
import com.project.Student.Performane.System.Entity.Student;
import com.project.Student.Performane.System.repo.FeedbackRepository;
import com.project.Student.Performane.System.repo.StudentRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Map;

@Slf4j
@Service
@RequiredArgsConstructor
public class FeedbackService {

    private final FeedbackRepository feedbackRepository;
    private final StudentRepository studentRepository;
    private final SentimentAnalysisService sentimentService;

    public record FeedbackRequest(
            Long studentId,
            String submittedBy,
            String category,
            String feedbackText,
            Integer rating
    ) {}

    public Feedback submitFeedback(FeedbackRequest req) {
        Student student = req.studentId() != null
                ? studentRepository.findById(req.studentId()).orElse(null)
                : null;

        SentimentAnalysisService.SentimentResult sentiment;
        try {
            sentiment = sentimentService.analyze(req.feedbackText(), req.category());
        } catch (Exception e) {
            log.warn("Sentiment analysis failed, using default: {}", e.getMessage());
            sentiment = new SentimentAnalysisService.SentimentResult(
                    "NEUTRAL", 0.5, "", "Sentiment analysis unavailable.");
        }

        Feedback feedback = Feedback.builder()
                .student(student)
                .submittedBy(req.submittedBy())
                .category(req.category())
                .feedbackText(req.feedbackText())
                .rating(req.rating())
                .sentimentLabel(sentiment.label())
                .sentimentScore(sentiment.score())
                .keyThemes(sentiment.themes())
                .aiSummary(sentiment.summary())
                .build();

        return feedbackRepository.save(feedback);
    }

    public List<Feedback> getFeedbackForStudent(Long studentId) {
        return feedbackRepository.findByStudentIdOrderBySubmittedAtDesc(studentId);
    }

    public Map<String, Object> getSentimentDashboard() {
        List<Object[]> counts = feedbackRepository.countBySentiment();
        Map<String, Long> distribution = new java.util.HashMap<>();
        for (Object[] row : counts) {
            distribution.put((String) row[0], (Long) row[1]);
        }
        long total = distribution.values().stream().mapToLong(Long::longValue).sum();
        return Map.of("distribution", distribution, "total", total);
    }
}