package com.project.Student.Performane.System.controller;

import com.project.Student.Performane.System.Entity.WeeklyReport;
import com.project.Student.Performane.System.service.ReportAnalysisService;
import com.project.Student.Performane.System.service.WeeklyReportSchedulerService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.*;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/reports")
@RequiredArgsConstructor
public class ReportController {

    private final ReportAnalysisService     reportAnalysisService;
    private final WeeklyReportSchedulerService schedulerService;

    @PostMapping("/generate/{studentId}")
    public ResponseEntity<WeeklyReport> generate(@PathVariable Long studentId) throws Exception {
        return ResponseEntity.ok(reportAnalysisService.generateReport(studentId));
    }

    @GetMapping("/student/{studentId}")
    public ResponseEntity<List<WeeklyReport>> history(@PathVariable Long studentId) {
        return ResponseEntity.ok(reportAnalysisService.getReportHistory(studentId));
    }

    @GetMapping("/{reportId}/pdf")
    public ResponseEntity<byte[]> downloadPdf(@PathVariable Long reportId) throws Exception {
        byte[] pdf = reportAnalysisService.generatePdf(reportId);
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_PDF);
        headers.setContentDisposition(
                ContentDisposition.attachment().filename("report-" + reportId + ".pdf").build());
        return new ResponseEntity<>(pdf, headers, HttpStatus.OK);
    }

    @PostMapping("/email/{studentId}")
    public ResponseEntity<String> sendEmail(@PathVariable Long studentId) throws Exception {
        schedulerService.triggerForStudent(studentId);
        return ResponseEntity.ok("Email sent successfully");
    }
}
