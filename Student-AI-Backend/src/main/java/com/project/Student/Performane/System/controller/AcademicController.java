package com.project.Student.Performane.System.controller;


import com.project.Student.Performane.System.Entity.*;
import com.project.Student.Performane.System.dto.*;
import com.project.Student.Performane.System.repo.*;
import com.project.Student.Performane.System.service.AcademicService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.*;

@RestController
@RequestMapping("/api/academic")
@RequiredArgsConstructor
public class AcademicController {

    private final AcademicService academicService;

    @PostMapping("/marks/{studentId}")
    public ResponseEntity<Mark> addMark(@PathVariable Long studentId,
                                        @RequestBody MarkDTO dto) {
        return ResponseEntity.ok(academicService.addMark(studentId, dto));
    }

    private final AssignmentRepository assignmentRepository;
    private final StudySessionRepository studySessionRepository;
    private final EngagementLogRepository engagementLogRepository;
    private final StudentRepository studentRepository;
    private final AttendanceRepository attendanceRepository;
    @PostMapping("/assignments/{studentId}")
    public ResponseEntity<Assignment> addAssignment(@PathVariable Long studentId,
                                                    @RequestBody AssignmentDTO dto) {
        Student student = studentRepository.findById(studentId)
                .orElseThrow(() -> new RuntimeException("Student not found"));
        Assignment a = Assignment.builder()
                .student(student)
                .subject(dto.getSubject())
                .title(dto.getTitle())
                .dueDate(dto.getDueDate())
                .submittedDate(dto.getSubmittedDate())
                .score(dto.getScore())
                .maxScore(dto.getMaxScore())
                .status(dto.getStatus())
                .build();
        return ResponseEntity.ok(assignmentRepository.save(a));
    }

    @PostMapping("/attendance/{studentId}")
    public ResponseEntity<Attendance> addAttendance(@PathVariable Long studentId,
                                                    @RequestBody AttendanceDTO dto) {
        return ResponseEntity.ok(academicService.addAttendance(studentId, dto));
    }

    @GetMapping("/attendance/{studentId}")
    public ResponseEntity<List<Attendance>> getAttendance(@PathVariable Long studentId) {

        return ResponseEntity.ok(attendanceRepository.findByStudentId(studentId));
    }
    @PostMapping("/study-sessions/{studentId}")
    public ResponseEntity<StudySession> addStudySession(@PathVariable Long studentId,
                                                        @RequestBody StudySessionDTO dto) {
        Student student = studentRepository.findById(studentId)
                .orElseThrow(() -> new RuntimeException("Student not found"));
        StudySession s = StudySession.builder()
                .student(student)
                .subject(dto.getSubject())
                .date(dto.getDate())
                .hoursStudied(dto.getHoursStudied())
                .revisionSession(dto.getRevisionSession())
                .build();
        return ResponseEntity.ok(studySessionRepository.save(s));
    }

    @PostMapping("/engagement/{studentId}")
    public ResponseEntity<EngagementLog> addEngagement(@PathVariable Long studentId,
                                                       @RequestBody EngagementLogDTO dto) {
        Student student = studentRepository.findById(studentId)
                .orElseThrow(() -> new RuntimeException("Student not found"));
        EngagementLog e = EngagementLog.builder()
                .student(student)
                .date(dto.getDate())
                .loginCount(dto.getLoginCount())
                .sessionDurationMinutes(dto.getSessionDurationMinutes())
                .materialsAccessed(dto.getMaterialsAccessed())
                .doubtSessionsAttended(dto.getDoubtSessionsAttended())
                .lectureCompletionRate(dto.getLectureCompletionRate())
                .build();
        return ResponseEntity.ok(engagementLogRepository.save(e));
    }
    @GetMapping("/marks/{studentId}")
    public ResponseEntity<List<Mark>> getMarks(@PathVariable Long studentId) {
        return ResponseEntity.ok(academicService.getMarksByStudent(studentId));
    }

    @GetMapping("/summary/{studentId}")
    public ResponseEntity<Map<String, Object>> getSummary(@PathVariable Long studentId) {
        return ResponseEntity.ok(academicService.getStudentSummary(studentId));
    }
}
