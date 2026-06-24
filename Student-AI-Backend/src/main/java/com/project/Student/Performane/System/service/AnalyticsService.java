package com.project.Student.Performane.System.service;

import com.project.Student.Performane.System.Entity.*;
import com.project.Student.Performane.System.dto.PerformanceSummaryDTO;
import com.project.Student.Performane.System.repo.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class AnalyticsService {

    private final StudentRepository studentRepository;
    private final MarkRepository markRepository;
    private final AttendanceRepository attendanceRepository;
    private final AssignmentRepository assignmentRepository;
    private final StudySessionRepository studySessionRepository;
    private final EngagementLogRepository      engagementLogRepository;
    private final PerformanceSummaryRepository summaryRepository;


    public PerformanceSummaryDTO computeAndSave(Long studentId) {
        Student student = studentRepository.findById(studentId)
                .orElseThrow(() -> new RuntimeException("Student not found: " + studentId));

        List<Mark>          marks    = markRepository.findByStudentId(studentId);
        List<Assignment>    assigns  = assignmentRepository.findByStudentId(studentId);
        List<StudySession>  sessions = studySessionRepository.findByStudentId(studentId);

        double avgScore       = computeAvgScore(marks);
        double recentAvg      = computeRecentAvgScore(marks, 3);
        double trend          = computeScoreTrend(marks);
        double variance       = computeSubjectVariance(marks);
        String best           = findBestSubject(marks);
        String weakest        = findWeakestSubject(marks);

        double attendance     = computeAttendance(studentId);
        int consAbsences      = computeConsecutiveAbsences(studentId);
        boolean lowAttendance = attendance < 75.0;

        double assignRate     = computeAssignmentCompletionRate(assigns);
        double avgDelay       = computeAvgSubmissionDelay(assigns);
        double assignScore    = computeAssignmentAvgScore(assigns);

        double weeklyHours    = computeWeeklyStudyHours(sessions);
        double studyConsist   = computeStudyConsistencyScore(sessions);
        double revisionRate   = computeRevisionRate(sessions);

        double avgSession     = orZero(engagementLogRepository.findAvgSessionDuration(studentId));
        double avgMaterials   = orZero(engagementLogRepository.findAvgMaterialsAccessed(studentId));
        double avgLecture     = orZero(engagementLogRepository.findAvgLectureCompletion(studentId));

        double consistIndex   = computeConsistencyIndex(variance, studyConsist, attendance);
        double effortOutcome  = computeEffortOutcomeRatio(weeklyHours, avgScore);
        double riskScore      = computeRiskScore(
                avgScore, trend, attendance, consAbsences,
                assignRate, avgSession, consistIndex
        );
        String riskLevel      = getRiskLevel(riskScore);

        boolean atRisk        = riskScore >= 60.0;
        boolean suddenDrop    = detectSuddenDrop(marks);
        boolean lowEngagement = avgSession < 10.0 && avgMaterials < 1.0;

        PerformanceSummary summary = PerformanceSummary.builder()
                .student(student)
                .avgScore(r(avgScore))
                .recentAvgScore(r(recentAvg))
                .scoreTrend(r(trend))
                .subjectVariance(r(variance))
                .bestSubject(best)
                .weakestSubject(weakest)
                .attendancePercentage(r(attendance))
                .consecutiveAbsences(consAbsences)
                .lowAttendanceFlag(lowAttendance)
                .assignmentCompletionRate(r(assignRate))
                .avgSubmissionDelayDays(r(avgDelay))
                .assignmentAvgScore(r(assignScore))
                .weeklyStudyHours(r(weeklyHours))
                .studyConsistencyScore(r(studyConsist))
                .revisionRate(r(revisionRate))
                .avgSessionDurationMinutes(r(avgSession))
                .avgMaterialsAccessed(r(avgMaterials))
                .avgLectureCompletionRate(r(avgLecture))
                .consistencyIndex(r(consistIndex))
                .effortOutcomeRatio(r(effortOutcome))
                .riskScore(r(riskScore))
                .riskLevel(riskLevel)
                .atRiskFlag(atRisk)
                .suddenDropFlag(suddenDrop)
                .lowEngagementFlag(lowEngagement)
                .build();

        summaryRepository.save(summary);
        return toDTO(summary, studentId, student.getName());
    }

    public PerformanceSummaryDTO getLatestSummary(Long studentId) {
        PerformanceSummary s = summaryRepository
                .findTopByStudentIdOrderByComputedAtDesc(studentId)
                .orElseThrow(() -> new RuntimeException(
                        "No analytics found. Call POST /api/analytics/compute/" + studentId));
        return toDTO(s, studentId, s.getStudent().getName());
    }

    private double computeAvgScore(List<Mark> marks) {
        if (marks.isEmpty()) return 0.0;
        return marks.stream()
                .mapToDouble(Mark::getPercentage)
                .average().orElse(0.0);
    }


    private double computeRecentAvgScore(List<Mark> marks, int n) {
        return marks.stream()
                .filter(m -> m.getExamDate() != null)
                .sorted(Comparator.comparing(Mark::getExamDate).reversed())
                .limit(n)
                .mapToDouble(Mark::getPercentage)
                .average().orElse(computeAvgScore(marks));
    }


    private double computeScoreTrend(List<Mark> marks) {
        List<Mark> sorted = marks.stream()
                .filter(m -> m.getExamDate() != null)
                .sorted(Comparator.comparing(Mark::getExamDate))
                .collect(Collectors.toList());

        if (sorted.size() < 2) return 0.0;
        int mid = sorted.size() / 2;

        double firstHalf = sorted.subList(0, mid).stream()
                .mapToDouble(Mark::getPercentage).average().orElse(0.0);
        double secondHalf = sorted.subList(mid, sorted.size()).stream()
                .mapToDouble(Mark::getPercentage).average().orElse(0.0);

        return secondHalf - firstHalf;
    }


    private double computeSubjectVariance(List<Mark> marks) {
        Map<String, Double> subjectAvgs = marks.stream()
                .collect(Collectors.groupingBy(
                        Mark::getSubject,
                        Collectors.averagingDouble(Mark::getPercentage)));

        if (subjectAvgs.size() < 2) return 0.0;
        double mean = subjectAvgs.values().stream()
                .mapToDouble(Double::doubleValue).average().orElse(0.0);
        return subjectAvgs.values().stream()
                .mapToDouble(v -> Math.pow(v - mean, 2)).average().orElse(0.0);
    }

    private String findBestSubject(List<Mark> marks) {
        return subjectAvgMap(marks).entrySet().stream()
                .max(Map.Entry.comparingByValue())
                .map(Map.Entry::getKey).orElse("N/A");
    }

    private String findWeakestSubject(List<Mark> marks) {
        return subjectAvgMap(marks).entrySet().stream()
                .min(Map.Entry.comparingByValue())
                .map(Map.Entry::getKey).orElse("N/A");
    }

    private Map<String, Double> subjectAvgMap(List<Mark> marks) {
        return marks.stream().collect(Collectors.groupingBy(
                Mark::getSubject, Collectors.averagingDouble(Mark::getPercentage)));
    }


    private double computeAttendance(Long studentId) {
        Double v = attendanceRepository.findOverallAttendanceByStudentId(studentId);
        return v != null ? v : 0.0;
    }


    private int computeConsecutiveAbsences(Long studentId) {
        List<Attendance> records = attendanceRepository.findByStudentId(studentId);
        records.sort(Comparator.comparing(a -> (a.getYear() * 12 + a.getMonth())));

        int maxRun = 0, currentRun = 0;
        for (Attendance a : records) {
            if (a.getAttendancePercentage() < 60.0) {
                currentRun++;
                maxRun = Math.max(maxRun, currentRun);
            } else {
                currentRun = 0;
            }
        }
        return maxRun;
    }

    private double computeAssignmentCompletionRate(List<Assignment> assigns) {
        if (assigns.isEmpty()) return 100.0;
        long submitted = assigns.stream()
                .filter(a -> a.getStatus() != Assignment.SubmissionStatus.NOT_SUBMITTED)
                .count();
        return (submitted * 100.0) / assigns.size();
    }


    private double computeAvgSubmissionDelay(List<Assignment> assigns) {
        return assigns.stream()
                .filter(a -> a.getSubmittedDate() != null && a.getDueDate() != null)
                .filter(a -> a.getSubmittedDate().isAfter(a.getDueDate())) // only late ones
                .mapToLong(a -> ChronoUnit.DAYS.between(a.getDueDate(), a.getSubmittedDate()))
                .filter(days -> days > 0)
                .average()
                .orElse(0.0);
    }

    private double computeAssignmentAvgScore(List<Assignment> assigns) {
        return assigns.stream()
                .filter(a -> a.getScore() != null && a.getMaxScore() != null && a.getMaxScore() > 0)
                .mapToDouble(a -> (a.getScore() / a.getMaxScore()) * 100)
                .average().orElse(0.0);
    }

    private double computeWeeklyStudyHours(List<StudySession> sessions) {
        if (sessions.isEmpty()) return 0.0;
        double total = sessions.stream()
                .mapToDouble(s -> s.getHoursStudied() != null ? s.getHoursStudied() : 0)
                .sum();
        long distinctWeeks = sessions.stream()
                .filter(s -> s.getDate() != null)
                .map(s -> s.getDate().get(java.time.temporal.WeekFields.ISO.weekOfWeekBasedYear())
                        + "-" + s.getDate().getYear())
                .distinct().count();
        return distinctWeeks > 0 ? total / distinctWeeks : total;
    }


    private double computeStudyConsistencyScore(List<StudySession> sessions) {
        if (sessions.size() < 2) return sessions.isEmpty() ? 0.0 : 50.0;

        LocalDate first = sessions.stream()
                .filter(s -> s.getDate() != null)
                .map(StudySession::getDate).min(Comparator.naturalOrder()).orElse(null);
        LocalDate last = sessions.stream()
                .filter(s -> s.getDate() != null)
                .map(StudySession::getDate).max(Comparator.naturalOrder()).orElse(null);

        if (first == null || last == null || first.equals(last)) return 50.0;

        long totalWeeks = ChronoUnit.WEEKS.between(first, last) + 1;
        long activeWeeks = sessions.stream()
                .filter(s -> s.getDate() != null)
                .map(s -> s.getDate().get(java.time.temporal.WeekFields.ISO.weekOfWeekBasedYear())
                        + "-" + s.getDate().getYear())
                .distinct().count();

        return Math.min(100.0, (activeWeeks * 100.0) / totalWeeks);
    }

    private double computeRevisionRate(List<StudySession> sessions) {
        if (sessions.isEmpty()) return 0.0;
        long revisions = sessions.stream()
                .filter(s -> Boolean.TRUE.equals(s.getRevisionSession())).count();
        return (revisions * 100.0) / sessions.size();
    }


    private double computeConsistencyIndex(double variance,
                                           double studyConsistency,
                                           double attendance) {
        double varianceScore = Math.max(0, 100 - variance);
        return (varianceScore * 0.40) + (studyConsistency * 0.30) + (attendance * 0.30);
    }


    private double computeEffortOutcomeRatio(double weeklyHours, double avgScore) {
        if (avgScore == 0) return 0.0;
        double effortScore = Math.min(100.0, (weeklyHours / 20.0) * 100);
        return effortScore / avgScore;
    }


    private double computeRiskScore(double avgScore, double trend,
                                    double attendance, int consAbsences,
                                    double assignRate, double avgSession,
                                    double consistIndex) {

        double academicRisk    = Math.max(0, 100 - avgScore);
        double trendRisk       = trend < 0 ? Math.min(100, -trend * 3) : 0;
        double attendanceRisk  = Math.max(0, 100 - attendance);
        double absenceRisk     = Math.min(100, consAbsences * 20.0);
        double assignRisk      = Math.max(0, 100 - assignRate);
        double engagementRisk  = avgSession < 5 ? 80 : Math.max(0, 60 - avgSession);
        double consistRisk     = Math.max(0, 100 - consistIndex);

        return (academicRisk   * 0.25)
                + (trendRisk      * 0.15)
                + (attendanceRisk * 0.20)
                + (absenceRisk    * 0.15)
                + (assignRisk     * 0.10)
                + (engagementRisk * 0.05)
                + (consistRisk    * 0.10);
    }

    private String getRiskLevel(double riskScore) {
        if (riskScore >= 65) return "HIGH";
        if (riskScore >= 35) return "MEDIUM";
        return "LOW";
    }


    private boolean detectSuddenDrop(List<Mark> marks) {
        List<Mark> sorted = marks.stream()
                .filter(m -> m.getExamDate() != null)
                .sorted(Comparator.comparing(Mark::getExamDate))
                .collect(Collectors.toList());

        if (sorted.size() < 2) return false;

        Mark latest = sorted.get(sorted.size() - 1);
        double prevAvg = sorted.subList(0, sorted.size() - 1).stream()
                .mapToDouble(Mark::getPercentage).average().orElse(0.0);

        return (prevAvg - latest.getPercentage()) > 20.0;
    }


    private double r(double v) { return Math.round(v * 100.0) / 100.0; }
    private double orZero(Double v) { return v != null ? v : 0.0; }

    private PerformanceSummaryDTO toDTO(PerformanceSummary s, Long studentId, String name) {
        return PerformanceSummaryDTO.builder()
                .studentId(studentId)
                .studentName(name)
                .avgScore(s.getAvgScore())
                .recentAvgScore(s.getRecentAvgScore())
                .scoreTrend(s.getScoreTrend())
                .subjectVariance(s.getSubjectVariance())
                .bestSubject(s.getBestSubject())
                .weakestSubject(s.getWeakestSubject())
                .attendancePercentage(s.getAttendancePercentage())
                .consecutiveAbsences(s.getConsecutiveAbsences())
                .lowAttendanceFlag(s.getLowAttendanceFlag())
                .assignmentCompletionRate(s.getAssignmentCompletionRate())
                .avgSubmissionDelayDays(s.getAvgSubmissionDelayDays())
                .assignmentAvgScore(s.getAssignmentAvgScore())
                .weeklyStudyHours(s.getWeeklyStudyHours())
                .studyConsistencyScore(s.getStudyConsistencyScore())
                .revisionRate(s.getRevisionRate())
                .avgSessionDurationMinutes(s.getAvgSessionDurationMinutes())
                .avgMaterialsAccessed(s.getAvgMaterialsAccessed())
                .avgLectureCompletionRate(s.getAvgLectureCompletionRate())
                .consistencyIndex(s.getConsistencyIndex())
                .effortOutcomeRatio(s.getEffortOutcomeRatio())
                .riskScore(s.getRiskScore())
                .riskLevel(s.getRiskLevel())
                .atRiskFlag(s.getAtRiskFlag())
                .suddenDropFlag(s.getSuddenDropFlag())
                .lowEngagementFlag(s.getLowEngagementFlag())
                .computedAt(s.getComputedAt())
                .build();
    }
}