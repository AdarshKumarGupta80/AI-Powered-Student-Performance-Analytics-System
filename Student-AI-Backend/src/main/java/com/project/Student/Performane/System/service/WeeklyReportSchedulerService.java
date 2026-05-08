package com.project.Student.Performane.System.service;

import com.project.Student.Performane.System.Entity.Student;
import com.project.Student.Performane.System.Entity.WeeklyReport;
import com.project.Student.Performane.System.repo.StudentRepository;
import com.project.Student.Performane.System.repo.WeeklyReportRepository;
import jakarta.mail.internet.MimeMessage;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class WeeklyReportSchedulerService {

    private final StudentRepository      studentRepository;
    private final ReportAnalysisService  reportAnalysisService;
    private final WeeklyReportRepository weeklyReportRepository;
    private final JavaMailSender         mailSender;

    @Value("${spring.mail.username:noreply@studentai.com}")
    private String fromEmail;


    @Scheduled(cron = "${report.cron.expression:0 0 8 * * MON}")
    public void runWeeklyReports() {
        log.info("=== Weekly report job started ===");
        List<Student> students = studentRepository.findAll();
        int success = 0, failed = 0;

        for (Student student : students) {
            try {
                WeeklyReport report = reportAnalysisService.generateReport(student.getId());
                sendReportEmail(student, report);
                report.setEmailSent(true);
                weeklyReportRepository.save(report);
                success++;
            } catch (Exception e) {
                log.error("Failed report for student {}: {}", student.getId(), e.getMessage());
                failed++;
            }
        }
        log.info("=== Weekly reports: {} sent, {} failed ===", success, failed);
    }

    public void triggerForStudent(Long studentId) throws Exception {
        Student student = studentRepository.findById(studentId)
                .orElseThrow(() -> new RuntimeException("Student not found"));
        WeeklyReport report = reportAnalysisService.generateReport(studentId);
        sendReportEmail(student, report);
        report.setEmailSent(true);
        weeklyReportRepository.save(report);
    }

    private void sendReportEmail(Student student, WeeklyReport report) throws Exception {
        MimeMessage message = mailSender.createMimeMessage();
        MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");
        helper.setFrom(fromEmail, "StudentAI Analytics");
        helper.setTo(student.getEmail());
        helper.setSubject("📊 Your Weekly Performance Report — StudentAI");
        helper.setText(buildEmailHtml(student, report), true);
        mailSender.send(message);
        log.info("Report email sent to {}", student.getEmail());
    }

    private String buildEmailHtml(Student student, WeeklyReport r) {
        String riskColor = switch (r.getRiskLevelSnapshot() != null ? r.getRiskLevelSnapshot() : "LOW") {
            case "HIGH"   -> "#dc2626";
            case "MEDIUM" -> "#d97706";
            default       -> "#16a34a";
        };
        String preview = r.getAiAnalysis() != null && r.getAiAnalysis().length() > 500
                ? r.getAiAnalysis().substring(0, 500) + "..." : r.getAiAnalysis();

        return """
            <html><body style="font-family:Arial,sans-serif;max-width:600px;margin:auto;color:#1f2937">
              <div style="background:#4f46e5;padding:24px;border-radius:8px;margin-bottom:20px">
                <h2 style="color:white;margin:0">📊 Weekly Performance Report</h2>
                <p style="color:rgba(255,255,255,0.85);margin:4px 0 0">Hi %s, here's your weekly summary</p>
              </div>
              <table style="width:100%%;border-collapse:separate;border-spacing:8px;margin-bottom:20px">
                <tr>
                  <td style="background:#f3f4f6;padding:16px;border-radius:8px;text-align:center">
                    <div style="font-size:24px;font-weight:700;color:#4f46e5">%.1f%%</div>
                    <div style="font-size:12px;color:#6b7280">Avg Score</div>
                  </td>
                  <td style="background:#f3f4f6;padding:16px;border-radius:8px;text-align:center">
                    <div style="font-size:24px;font-weight:700;color:#4f46e5">%.1f%%</div>
                    <div style="font-size:12px;color:#6b7280">Attendance</div>
                  </td>
                  <td style="background:#f3f4f6;padding:16px;border-radius:8px;text-align:center">
                    <span style="background:%s;color:white;padding:4px 12px;border-radius:20px;font-weight:600;font-size:13px">%s</span>
                    <div style="font-size:12px;color:#6b7280;margin-top:4px">Risk Level</div>
                  </td>
                </tr>
              </table>
              <div style="background:#fafafa;border-left:4px solid #4f46e5;padding:20px;border-radius:0 8px 8px 0;margin-bottom:20px;line-height:1.7">
                %s
              </div>
              <div style="font-size:11px;color:#9ca3af;border-top:1px solid #e5e7eb;padding-top:12px">
                StudentAI Analytics Platform • Auto-generated weekly report
              </div>
            </body></html>
            """.formatted(
                student.getName(),
                r.getAvgScoreSnapshot() != null ? r.getAvgScoreSnapshot() : 0.0,
                r.getAttendanceSnapshot() != null ? r.getAttendanceSnapshot() : 0.0,
                riskColor, r.getRiskLevelSnapshot(),
                preview != null ? preview.replaceAll("\n", "<br/>") : ""
        );
    }
}
