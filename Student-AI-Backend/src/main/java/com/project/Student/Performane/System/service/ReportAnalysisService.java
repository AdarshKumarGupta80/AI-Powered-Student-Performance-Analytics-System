package com.project.Student.Performane.System.service;

import com.itextpdf.html2pdf.HtmlConverter;
import com.project.Student.Performane.System.Entity.Student;
import com.project.Student.Performane.System.Entity.WeeklyReport;
import com.project.Student.Performane.System.dto.PerformanceSummaryDTO;
import com.project.Student.Performane.System.repo.StudentRepository;
import com.project.Student.Performane.System.repo.WeeklyReportRepository;
import lombok.RequiredArgsConstructor;
import okhttp3.*;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import tools.jackson.databind.JsonNode;
import tools.jackson.databind.ObjectMapper;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class ReportAnalysisService {

    @Value("${grok.api.key}")
    private String apiKey;

    private static final String GROK_URL = "https://api.groq.com/openai/v1/chat/completions";
    private static final String MODEL    = "llama-3.1-8b-instant";

    private final OkHttpClient           http              = new OkHttpClient();
    private final ObjectMapper           mapper            = new ObjectMapper();
    private final WeeklyReportRepository reportRepository;
    private final StudentRepository      studentRepository;
    private final AnalyticsService       analyticsService;

    public WeeklyReport generateReport(Long studentId) throws IOException {
        Student student = studentRepository.findById(studentId)
                .orElseThrow(() -> new RuntimeException("Student not found: " + studentId));

        PerformanceSummaryDTO summary = analyticsService.getLatestSummary(studentId);
        String aiText = callGroqForAnalysis(student, summary);
        String html   = buildReportHtml(student, summary, aiText);

        WeeklyReport report = WeeklyReport.builder()
                .student(student)
                .aiAnalysis(aiText)
                .htmlContent(html)
                .avgScoreSnapshot(summary.getAvgScore())
                .attendanceSnapshot(summary.getAttendancePercentage())
                .riskLevelSnapshot(summary.getRiskLevel())
                .weekStart(LocalDate.now().with(java.time.DayOfWeek.MONDAY))
                .emailSent(false)
                .build();

        return reportRepository.save(report);
    }

    public byte[] generatePdf(Long reportId) throws IOException {
        WeeklyReport report = reportRepository.findById(reportId)
                .orElseThrow(() -> new RuntimeException("Report not found: " + reportId));
        ByteArrayOutputStream baos = new ByteArrayOutputStream();
        HtmlConverter.convertToPdf(report.getHtmlContent(), baos);
        return baos.toByteArray();
    }

    public List<WeeklyReport> getReportHistory(Long studentId) {
        return reportRepository.findByStudentIdOrderByGeneratedAtDesc(studentId);
    }


    private String callGroqForAnalysis(Student student, PerformanceSummaryDTO s) throws IOException {
        String systemPrompt = """
                You are an expert academic advisor AI.
                Analyse student performance data and write a professional weekly report.
                Structure it in these sections:
                1. **Executive Summary** (2-3 sentences)
                2. **Academic Performance Analysis**
                3. **Attendance & Engagement Analysis**
                4. **Risk Assessment**
                5. **Personalized Recommendations** (at least 3 specific, actionable steps)
                6. **Goals for Next Week**
                Be data-driven, empathetic, and motivating. Write in second person.
                """;

        String userPrompt = String.format("""
                Generate a weekly performance report for:
                Student: %s | Department: %s | Semester: %d
                
                PERFORMANCE DATA:
                - Average Score: %.1f%% | Recent Average: %.1f%% | Score Trend: %.1f
                - Best Subject: %s | Weakest Subject: %s | Subject Variance: %.1f
                - Attendance: %.1f%% | Consecutive Absences: %d | Low Attendance Flag: %s
                - Assignment Completion: %.1f%% | Assignment Avg Score: %.1f%%
                - Weekly Study Hours: %.1f hrs | Study Consistency Score: %.1f%%
                - Revision Rate: %.1f%% | Consistency Index: %.1f
                - Risk Level: %s | Risk Score: %.1f | At Risk: %s
                - Sudden Score Drop Detected: %s | Low Engagement: %s
                """,
                student.getName(), student.getDepartment(), student.getSemester(),
                orZ(s.getAvgScore()), orZ(s.getRecentAvgScore()), orZ(s.getScoreTrend()),
                s.getBestSubject(), s.getWeakestSubject(), orZ(s.getSubjectVariance()),
                orZ(s.getAttendancePercentage()), orI(s.getConsecutiveAbsences()),
                s.getLowAttendanceFlag(),
                orZ(s.getAssignmentCompletionRate()), orZ(s.getAssignmentAvgScore()),
                orZ(s.getWeeklyStudyHours()), orZ(s.getStudyConsistencyScore()),
                orZ(s.getRevisionRate()), orZ(s.getConsistencyIndex()),
                s.getRiskLevel(), orZ(s.getRiskScore()),
                s.getAtRiskFlag(), s.getSuddenDropFlag(), s.getLowEngagementFlag()
        );

        Map<String, Object> body = Map.of(
                "model",       MODEL,
                "messages",    List.of(
                        Map.of("role", "system", "content", systemPrompt),
                        Map.of("role", "user",   "content", userPrompt)
                ),
                "temperature", 0.4,
                "max_tokens",  1500
        );

        RequestBody rb = RequestBody.create(
                mapper.writeValueAsString(body), MediaType.parse("application/json"));
        Request request = new Request.Builder()
                .url(GROK_URL)
                .addHeader("Authorization", "Bearer " + apiKey)
                .addHeader("Content-Type", "application/json")
                .post(rb).build();

        try (Response response = http.newCall(request).execute()) {
            if (!response.isSuccessful())
                throw new IOException("Groq error: " + response.code() + " " + response.body().string());
            JsonNode root = mapper.readTree(response.body().string());
            return root.get("choices").get(0).get("message").get("content").asText();
        }
    }

    private String buildReportHtml(Student student, PerformanceSummaryDTO s, String aiAnalysis) {
        String weekStr = LocalDate.now().format(DateTimeFormatter.ofPattern("MMMM dd, yyyy"));
        String htmlAnalysis = aiAnalysis
                .replaceAll("\\*\\*(.*?)\\*\\*", "<strong>$1</strong>")
                .replaceAll("\n", "<br/>");

        String riskColor = switch (s.getRiskLevel() != null ? s.getRiskLevel() : "LOW") {
            case "HIGH"   -> "#dc2626";
            case "MEDIUM" -> "#d97706";
            default       -> "#16a34a";
        };

        return """
            <!DOCTYPE html>
            <html><head><style>
              body { font-family: Arial, sans-serif; margin: 40px; color: #1f2937; }
              .header { background: #4f46e5; color: white; padding: 24px; border-radius: 8px; margin-bottom: 24px; }
              .header h1 { margin: 0; font-size: 22px; }
              .header p  { margin: 4px 0 0; opacity: 0.85; font-size: 14px; }
              .metrics { margin-bottom: 24px; }
              .metric  { display: inline-block; background: #f3f4f6; padding: 16px 20px;
                         border-radius: 8px; margin: 6px; min-width: 120px; }
              .metric .val { font-size: 26px; font-weight: 700; color: #4f46e5; }
              .metric .lbl { font-size: 12px; color: #6b7280; margin-top: 4px; }
              .risk-badge { display: inline-block; padding: 4px 12px; border-radius: 20px;
                            color: white; font-weight: 600; font-size: 13px;
                            background: %s; }
              .analysis { background: #fafafa; border-left: 4px solid #4f46e5;
                          padding: 20px 24px; border-radius: 0 8px 8px 0; line-height: 1.7; }
              .footer { margin-top: 32px; font-size: 11px; color: #9ca3af;
                        border-top: 1px solid #e5e7eb; padding-top: 12px; }
            </style></head><body>
              <div class="header">
                <h1>Weekly Performance Report — %s</h1>
                <p>%s | %s, Semester %d | Generated: %s</p>
              </div>
              <div class="metrics">
                <div class="metric"><div class="val">%.1f%%</div><div class="lbl">Average Score</div></div>
                <div class="metric"><div class="val">%.1f%%</div><div class="lbl">Attendance</div></div>
                <div class="metric"><div class="val">%.1f hrs</div><div class="lbl">Weekly Study</div></div>
                <div class="metric"><div class="val">%.1f%%</div><div class="lbl">Assignments</div></div>
                <div class="metric">
                  <div class="lbl" style="margin-bottom:6px">Risk Level</div>
                  <span class="risk-badge">%s</span>
                </div>
              </div>
              <div class="analysis">%s</div>
              <div class="footer">
                Auto-generated by StudentAI Analytics • Week of %s
              </div>
            </body></html>
            """.formatted(
                riskColor,
                student.getName(), student.getEmail(),
                student.getDepartment(), student.getSemester(), weekStr,
                orZ(s.getAvgScore()), orZ(s.getAttendancePercentage()),
                orZ(s.getWeeklyStudyHours()), orZ(s.getAssignmentCompletionRate()),
                s.getRiskLevel(), htmlAnalysis, weekStr
        );
    }

    private double orZ(Double v)  { return v != null ? v : 0.0; }
    private int    orI(Integer v) { return v != null ? v : 0; }
}
