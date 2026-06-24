package com.project.Student.Performane.System.service;


import com.project.Student.Performane.System.Entity.Recommendation;
import com.project.Student.Performane.System.Entity.Student;
import com.project.Student.Performane.System.dto.*;
import com.project.Student.Performane.System.repo.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class RecommendationService {

    private final RecommendationRepository recommendationRepository;
    private final StudentRepository        studentRepository;


    public List<RecommendationDTO> generateAndSave(
            Long studentId,
            PerformanceSummaryDTO analytics,
            Map<String, Object> prediction) {

        Student student = studentRepository.findById(studentId)
                .orElseThrow(() -> new RuntimeException("Student not found: " + studentId));

        recommendationRepository.deleteAllByStudentId(studentId);

        List<Recommendation> recommendations = new ArrayList<>();

        recommendations.addAll(evaluateAttendanceRules(student, analytics));
        recommendations.addAll(evaluateAcademicRules(student, analytics, prediction));
        recommendations.addAll(evaluateAssignmentRules(student, analytics));
        recommendations.addAll(evaluateStudyHabitRules(student, analytics));
        recommendations.addAll(evaluateEngagementRules(student, analytics));
        recommendations.addAll(evaluateConsistencyRules(student, analytics));
        recommendations.addAll(evaluateExamPrepRules(student, analytics, prediction));

        List<Recommendation> deduped = deduplicateAndSort(recommendations);

        recommendationRepository.saveAll(deduped);

        return deduped.stream().map(this::toDTO).collect(Collectors.toList());
    }

    public List<RecommendationDTO> getRecommendations(Long studentId) {
        return recommendationRepository
                .findByStudentIdOrderByPriorityAscGeneratedAtDesc(studentId)
                .stream().map(this::toDTO).collect(Collectors.toList());
    }

    public List<RecommendationDTO> getUnreadRecommendations(Long studentId) {
        return recommendationRepository
                .findByStudentIdAndIsReadFalseOrderByPriorityAsc(studentId)
                .stream().map(this::toDTO).collect(Collectors.toList());
    }

    public void markAllAsRead(Long studentId) {
        List<Recommendation> recs =
                recommendationRepository.findByStudentIdAndIsReadFalseOrderByPriorityAsc(studentId);
        recs.forEach(r -> r.setIsRead(true));
        recommendationRepository.saveAll(recs);
    }



    private List<Recommendation> evaluateAttendanceRules(
            Student student, PerformanceSummaryDTO a) {

        List<Recommendation> recs = new ArrayList<>();
        double att = orZero(a.getAttendancePercentage());
        int consec = a.getConsecutiveAbsences() != null ? a.getConsecutiveAbsences() : 0;

        if (att < 60) {
            recs.add(build(student,
                    "Your attendance is critically low at " + att + "%. You are at serious risk of being detained.",
                    "Attend every class for the next 4 weeks without exception.",
                    Recommendation.Priority.CRITICAL,
                    Recommendation.Category.ATTENDANCE,
                    "Attendance below 60%: " + att + "%"
            ));
        }
        else if (att < 75) {
            recs.add(build(student,
                    "Your attendance of " + att + "% is below the required 75%. Act now to avoid academic penalties.",
                    "Attend at least 90% of all classes this month to recover your attendance.",
                    Recommendation.Priority.HIGH,
                    Recommendation.Category.ATTENDANCE,
                    "Attendance below 75%: " + att + "%"
            ));
        }
        else if (att < 85) {
            recs.add(build(student,
                    "Your attendance is " + att + "%. Maintaining above 85% will give you a strong safety buffer.",
                    "Try not to miss any classes this week.",
                    Recommendation.Priority.MEDIUM,
                    Recommendation.Category.ATTENDANCE,
                    "Attendance below 85%: " + att + "%"
            ));
        }

        if (consec >= 3) {
            recs.add(build(student,
                    "You have missed classes for " + consec + " consecutive months. This pattern is a strong risk signal.",
                    "Talk to your teacher or counselor about what's causing the absences.",
                    Recommendation.Priority.CRITICAL,
                    Recommendation.Category.ATTENDANCE,
                    "Consecutive absence streak: " + consec + " months"
            ));
        } else if (consec == 2) {
            recs.add(build(student,
                    "You have had low attendance for 2 months in a row. Don't let this become a habit.",
                    "Set a daily alarm and plan your commute the night before.",
                    Recommendation.Priority.HIGH,
                    Recommendation.Category.ATTENDANCE,
                    "Consecutive absence streak: 2 months"
            ));
        }

        return recs;
    }


    private List<Recommendation> evaluateAcademicRules(
            Student student,
            PerformanceSummaryDTO a,
            Map<String, Object> prediction) {

        List<Recommendation> recs = new ArrayList<>();
        double avg    = orZero(a.getAvgScore());
        double recent = orZero(a.getRecentAvgScore());
        double trend  = orZero(a.getScoreTrend());
        double variance = orZero(a.getSubjectVariance());
        String weakest  = a.getWeakestSubject();
        String best     = a.getBestSubject();

        double predictedScore = 0;
        if (prediction != null && prediction.get("predictedScore") != null) {
            predictedScore = Double.parseDouble(prediction.get("predictedScore").toString());
        }

        if (avg < 40) {
            recs.add(build(student,
                    "Your average score is critically low at " + avg + "%. Immediate intervention is needed.",
                    "Schedule a meeting with your subject teachers this week and request extra guidance.",
                    Recommendation.Priority.CRITICAL,
                    Recommendation.Category.ACADEMIC_PERFORMANCE,
                    "Average score below 40%: " + avg + "%"
            ));
        } else if (avg < 55) {
            recs.add(build(student,
                    "Your average score of " + avg + "% is below passing standard. Focus on your weakest areas.",
                    "Spend an extra 30 minutes daily on " + (weakest != null ? weakest : "your weakest subject") + ".",
                    Recommendation.Priority.HIGH,
                    Recommendation.Category.ACADEMIC_PERFORMANCE,
                    "Average score below 55%: " + avg + "%"
            ));
        }

        if (trend < -15) {
            recs.add(build(student,
                    "Your scores have been declining sharply (trend: " + trend + " points). This is a serious warning sign.",
                    "Review all topics from the last 3 exams and identify exactly where marks were lost.",
                    Recommendation.Priority.CRITICAL,
                    Recommendation.Category.ACADEMIC_PERFORMANCE,
                    "Score trend: " + trend
            ));
        } else if (trend < -5) {
            recs.add(build(student,
                    "Your recent scores are lower than your earlier performance (trend: " + trend + " points).",
                    "Revise topics from your last 2 exams before studying any new material.",
                    Recommendation.Priority.HIGH,
                    Recommendation.Category.ACADEMIC_PERFORMANCE,
                    "Negative score trend: " + trend
            ));
        }

        if ((avg - recent) > 15) {
            recs.add(build(student,
                    "Your recent exam scores (" + recent + "%) are significantly lower than your overall average (" + avg + "%). Something changed.",
                    "Talk to a teacher or counselor — external stress can affect performance.",
                    Recommendation.Priority.HIGH,
                    Recommendation.Category.MENTAL_HEALTH,
                    "Recent avg " + recent + "% vs overall avg " + avg + "%"
            ));
        }

        if (variance > 80) {
            recs.add(build(student,
                    "You perform very well in " + best + " but struggle in " + weakest + ". This inconsistency is hurting your GPA.",
                    "Dedicate 60% of your study time to " + weakest + " until scores are balanced.",
                    Recommendation.Priority.HIGH,
                    Recommendation.Category.ACADEMIC_PERFORMANCE,
                    "Subject variance: " + variance
            ));
        } else if (variance > 40) {
            recs.add(build(student,
                    "There's a noticeable gap between your best (" + best + ") and weakest (" + weakest + ") subjects.",
                    "Give " + weakest + " at least one dedicated study session per week.",
                    Recommendation.Priority.MEDIUM,
                    Recommendation.Category.ACADEMIC_PERFORMANCE,
                    "Subject variance: " + variance
            ));
        }

        if (predictedScore > 0 && predictedScore < 40) {
            recs.add(build(student,
                    "AI prediction: your projected final score is " + predictedScore + "%. You are at high risk of failing.",
                    "Seek help immediately — visit your academic advisor and request extra coaching sessions.",
                    Recommendation.Priority.CRITICAL,
                    Recommendation.Category.EXAM_PREPARATION,
                    "Predicted score: " + predictedScore + "%"
            ));
        } else if (predictedScore > 0 && predictedScore < 55) {
            recs.add(build(student,
                    "AI prediction: your projected score is " + predictedScore + "%. You need to improve to pass comfortably.",
                    "Create a subject-wise study plan for the next 4 weeks focusing on " + weakest + ".",
                    Recommendation.Priority.HIGH,
                    Recommendation.Category.EXAM_PREPARATION,
                    "Predicted score: " + predictedScore + "%"
            ));
        }

        return recs;
    }


    private List<Recommendation> evaluateAssignmentRules(
            Student student, PerformanceSummaryDTO a) {

        List<Recommendation> recs = new ArrayList<>();
        double rate  = orZero(a.getAssignmentCompletionRate());
        double delay = orZero(a.getAvgSubmissionDelayDays());
        double score = orZero(a.getAssignmentAvgScore());

        if (rate < 50) {
            recs.add(build(student,
                    "You have submitted fewer than half of your assignments (" + rate + "% completion rate).",
                    "Submit all pending assignments this week, even if incomplete — partial credit is better than zero.",
                    Recommendation.Priority.CRITICAL,
                    Recommendation.Category.ASSIGNMENT,
                    "Assignment completion: " + rate + "%"
            ));
        } else if (rate < 75) {
            recs.add(build(student,
                    "Your assignment submission rate is " + rate + "%. Missing assignments directly lower your grade.",
                    "Set a phone reminder 2 days before every assignment deadline.",
                    Recommendation.Priority.HIGH,
                    Recommendation.Category.ASSIGNMENT,
                    "Assignment completion: " + rate + "%"
            ));
        }

        if (delay > 5) {
            recs.add(build(student,
                    "You submit assignments an average of " + delay + " days late. Late submissions often carry grade penalties.",
                    "Start every assignment the day it is given, not the day before it is due.",
                    Recommendation.Priority.HIGH,
                    Recommendation.Category.ASSIGNMENT,
                    "Avg submission delay: " + delay + " days"
            ));
        } else if (delay > 2) {
            recs.add(build(student,
                    "You tend to submit assignments " + delay + " days late on average.",
                    "Try to submit 1 day early — this gives you time to fix errors.",
                    Recommendation.Priority.MEDIUM,
                    Recommendation.Category.ASSIGNMENT,
                    "Avg submission delay: " + delay + " days"
            ));
        }

        if (score > 0 && score < 50) {
            recs.add(build(student,
                    "Your average assignment score is only " + score + "%. You are submitting but not scoring well.",
                    "Before submitting, review assignment rubrics and compare your work against the marking criteria.",
                    Recommendation.Priority.MEDIUM,
                    Recommendation.Category.ASSIGNMENT,
                    "Assignment avg score: " + score + "%"
            ));
        }

        return recs;
    }


    private List<Recommendation> evaluateStudyHabitRules(
            Student student, PerformanceSummaryDTO a) {

        List<Recommendation> recs = new ArrayList<>();
        double hours      = orZero(a.getWeeklyStudyHours());
        double consistency = orZero(a.getStudyConsistencyScore());
        double revision   = orZero(a.getRevisionRate());
        double effort     = orZero(a.getEffortOutcomeRatio());

        if (hours < 5) {
            recs.add(build(student,
                    "You are studying less than 5 hours per week. This is far below the recommended minimum.",
                    "Block 1 hour of study time every day — consistency beats long cramming sessions.",
                    Recommendation.Priority.HIGH,
                    Recommendation.Category.STUDY_HABIT,
                    "Weekly study hours: " + hours
            ));
        } else if (hours < 10) {
            recs.add(build(student,
                    "You study around " + hours + " hours per week. Increasing to 12-15 hours would significantly improve outcomes.",
                    "Add one 90-minute study session on weekends to boost your weekly hours.",
                    Recommendation.Priority.MEDIUM,
                    Recommendation.Category.STUDY_HABIT,
                    "Weekly study hours: " + hours
            ));
        }

        if (consistency < 40) {
            recs.add(build(student,
                    "Your study routine is highly irregular (consistency score: " + consistency + "/100). Irregular studying leads to poor retention.",
                    "Fix a specific time each day for studying — even 45 minutes at the same time daily beats 3 hours randomly.",
                    Recommendation.Priority.HIGH,
                    Recommendation.Category.STUDY_HABIT,
                    "Study consistency score: " + consistency
            ));
        } else if (consistency < 60) {
            recs.add(build(student,
                    "Your study schedule has some gaps. More regularity would improve long-term memory.",
                    "Use a study planner or app to track your daily sessions this week.",
                    Recommendation.Priority.MEDIUM,
                    Recommendation.Category.STUDY_HABIT,
                    "Study consistency score: " + consistency
            ));
        }

        if (revision < 25) {
            recs.add(build(student,
                    "Less than 25% of your study sessions include revision. Without revisiting material, you forget up to 70% within a week.",
                    "Dedicate every third study session entirely to revision of previously studied topics.",
                    Recommendation.Priority.HIGH,
                    Recommendation.Category.STUDY_HABIT,
                    "Revision rate: " + revision + "%"
            ));
        }

        if (effort > 1.5 && hours > 12) {
            recs.add(build(student,
                    "You are putting in significant study time but your scores don't reflect it. Your study method may need to change.",
                    "Try active recall and spaced repetition instead of re-reading notes — these are proven to be far more effective.",
                    Recommendation.Priority.MEDIUM,
                    Recommendation.Category.STUDY_HABIT,
                    "High effort-outcome ratio: " + effort
            ));
        }

        return recs;
    }


    private List<Recommendation> evaluateEngagementRules(
            Student student, PerformanceSummaryDTO a) {

        List<Recommendation> recs = new ArrayList<>();
        double session   = orZero(a.getAvgSessionDurationMinutes());
        double materials = orZero(a.getAvgMaterialsAccessed());
        double lecture   = orZero(a.getAvgLectureCompletionRate());
        boolean lowEng   = Boolean.TRUE.equals(a.getLowEngagementFlag());

        if (lowEng) {
            recs.add(build(student,
                    "Your engagement with learning materials is very low. Students who engage regularly score 20-30% higher on average.",
                    "Log in to the learning portal daily and complete at least one resource per subject per week.",
                    Recommendation.Priority.HIGH,
                    Recommendation.Category.ENGAGEMENT,
                    "Low engagement flag triggered"
            ));
        }

        if (session < 15 && session > 0) {
            recs.add(build(student,
                    "Your average session duration is only " + session + " minutes — too short for meaningful learning.",
                    "Aim for at least 30-minute focused sessions — use the Pomodoro technique (25 min work, 5 min break).",
                    Recommendation.Priority.MEDIUM,
                    Recommendation.Category.ENGAGEMENT,
                    "Avg session duration: " + session + " minutes"
            ));
        }

        if (lecture > 0 && lecture < 0.50) {
            recs.add(build(student,
                    "You are completing less than 50% of your lectures (" + Math.round(lecture * 100) + "%). Incomplete lectures create knowledge gaps.",
                    "Before each new lecture, finish any incomplete ones from the previous week.",
                    Recommendation.Priority.MEDIUM,
                    Recommendation.Category.ENGAGEMENT,
                    "Lecture completion rate: " + (lecture * 100) + "%"
            ));
        }

        if (materials < 1.0 && materials > 0) {
            recs.add(build(student,
                    "You are accessing very few learning materials per session. Supplementing lectures with notes and references is critical.",
                    "Access at least 2 reference materials per subject per week.",
                    Recommendation.Priority.LOW,
                    Recommendation.Category.ENGAGEMENT,
                    "Avg materials accessed: " + materials
            ));
        }

        return recs;
    }


    private List<Recommendation> evaluateConsistencyRules(
            Student student, PerformanceSummaryDTO a) {

        List<Recommendation> recs = new ArrayList<>();
        double consistency = orZero(a.getConsistencyIndex());
        boolean suddenDrop = Boolean.TRUE.equals(a.getSuddenDropFlag());

        if (suddenDrop) {
            recs.add(build(student,
                    "AI detected a sudden significant drop in your recent exam score compared to your previous performance.",
                    "Identify what changed — new topic difficulty, personal stress, or exam technique issues — and address it immediately.",
                    Recommendation.Priority.CRITICAL,
                    Recommendation.Category.ACADEMIC_PERFORMANCE,
                    "Sudden drop flag: last exam significantly below personal average"
            ));
        }

        if (consistency < 35) {
            recs.add(build(student,
                    "Your overall consistency index is very low (" + consistency + "/100). Inconsistent performance makes it hard to predict or improve outcomes.",
                    "Focus on maintaining steady habits rather than peak performance — consistency compounds over time.",
                    Recommendation.Priority.HIGH,
                    Recommendation.Category.CONSISTENCY,
                    "Consistency index: " + consistency
            ));
        } else if (consistency < 55) {
            recs.add(build(student,
                    "Your consistency score is " + consistency + "/100. Small improvements in daily habits will raise this significantly.",
                    "Pick one habit to improve this week — attendance, daily study, or on-time submissions.",
                    Recommendation.Priority.MEDIUM,
                    Recommendation.Category.CONSISTENCY,
                    "Consistency index: " + consistency
            ));
        }

        return recs;
    }


    private List<Recommendation> evaluateExamPrepRules(
            Student student,
            PerformanceSummaryDTO a,
            Map<String, Object> prediction) {

        List<Recommendation> recs = new ArrayList<>();
        double avg    = orZero(a.getAvgScore());
        double trend  = orZero(a.getScoreTrend());
        String weakest = a.getWeakestSubject();

        String riskLevel = "LOW";
        if (prediction != null && prediction.get("riskLevel") != null) {
            riskLevel = prediction.get("riskLevel").toString();
        }

        if ("HIGH".equals(riskLevel)) {
            recs.add(build(student,
                    "You are classified as HIGH risk. Prioritize exam preparation over everything else right now.",
                    "Create a 4-week exam revision plan — divide topics into daily slots and track completion.",
                    Recommendation.Priority.HIGH,
                    Recommendation.Category.EXAM_PREPARATION,
                    "Risk level: HIGH"
            ));
        }

        if (weakest != null && !weakest.equals("N/A") && avg < 65) {
            recs.add(build(student,
                    weakest + " is your weakest subject. Targeted practice here will give the highest score improvement per hour.",
                    "Solve 10 past exam questions from " + weakest + " every day for the next 2 weeks.",
                    Recommendation.Priority.HIGH,
                    Recommendation.Category.EXAM_PREPARATION,
                    "Weakest subject: " + weakest + " with avg below 65%"
            ));
        }

        if (trend > 10) {
            recs.add(build(student,
                    "Great work — your scores are improving (trend: +" + trend + " points). Keep this momentum going!",
                    "Maintain your current study routine and review what's been working well.",
                    Recommendation.Priority.LOW,
                    Recommendation.Category.EXAM_PREPARATION,
                    "Positive score trend: +" + trend
            ));
        }

        return recs;
    }


    private Recommendation build(Student student, String message, String actionItem,
                                 Recommendation.Priority priority,
                                 Recommendation.Category category,
                                 String triggerReason) {
        return Recommendation.builder()
                .student(student)
                .message(message)
                .actionItem(actionItem)
                .priority(priority)
                .category(category)
                .triggerReason(triggerReason)
                .build();
    }

    private List<Recommendation> deduplicateAndSort(List<Recommendation> recs) {
        Map<String, Recommendation> seen = new LinkedHashMap<>();
        for (Recommendation r : recs) {
            seen.putIfAbsent(r.getMessage(), r);
        }
        List<Recommendation> sorted = new ArrayList<>(seen.values());
        sorted.sort(Comparator.comparing(Recommendation::getPriority));
        return sorted;
    }

    private double orZero(Double v) { return v != null ? v : 0.0; }

    private RecommendationDTO toDTO(Recommendation r) {
        return RecommendationDTO.builder()
                .id(r.getId())
                .message(r.getMessage())
                .actionItem(r.getActionItem())
                .priority(r.getPriority())
                .category(r.getCategory())
                .triggerReason(r.getTriggerReason())
                .isRead(r.getIsRead())
                .generatedAt(r.getGeneratedAt())
                .build();
    }
}