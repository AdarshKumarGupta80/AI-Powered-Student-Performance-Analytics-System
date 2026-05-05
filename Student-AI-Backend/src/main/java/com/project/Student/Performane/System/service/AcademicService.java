package com.project.Student.Performane.System.service;


import com.project.Student.Performane.System.Entity.Attendance;
import com.project.Student.Performane.System.Entity.Mark;
import com.project.Student.Performane.System.Entity.Student;
import com.project.Student.Performane.System.dto.AttendanceDTO;
import com.project.Student.Performane.System.dto.MarkDTO;
import com.project.Student.Performane.System.repo.AttendanceRepository;
import com.project.Student.Performane.System.repo.MarkRepository;
import com.project.Student.Performane.System.repo.StudentRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import java.util.*;

@Service
@RequiredArgsConstructor
public class AcademicService {

    private final MarkRepository markRepository;
    private final AttendanceRepository attendanceRepository;
    private final StudentRepository studentRepository;

    public Mark addMark(Long studentId, MarkDTO dto) {
        Student student = studentRepository.findById(studentId)
                .orElseThrow(() -> new RuntimeException("Student not found"));
        Mark mark = Mark.builder()
                .student(student)
                .subject(dto.getSubject())
                .score(dto.getScore())
                .maxScore(dto.getMaxScore())
                .examType(dto.getExamType())
                .examDate(dto.getExamDate())
                .build();
        return markRepository.save(mark);
    }

    public List<Mark> getMarksByStudent(Long studentId) {
        return markRepository.findByStudentId(studentId);
    }

    public Map<String, Object> getStudentSummary(Long studentId) {
        Double avgScore = markRepository.findAverageScoreByStudentId(studentId);
        Double attendance = attendanceRepository.findOverallAttendanceByStudentId(studentId);
        List<Mark> marks = markRepository.findByStudentId(studentId);

        Map<String, Object> summary = new LinkedHashMap<>();
        summary.put("studentId", studentId);
        summary.put("averageScore", avgScore != null ? Math.round(avgScore * 10.0) / 10.0 : 0);
        summary.put("overallAttendance", attendance != null ? Math.round(attendance * 10.0) / 10.0 : 0);
        summary.put("totalExams", marks.size());
        return summary;
    }

    public Attendance addAttendance(Long studentId, AttendanceDTO dto) {
        Student student = studentRepository.findById(studentId)
                .orElseThrow(() -> new RuntimeException("Student not found: " + studentId));

        Attendance attendance = Attendance.builder()
                .student(student)
                .subject(dto.getSubject() != null ? dto.getSubject() : "General")
                .month(dto.getMonth())
                .year(dto.getYear())
                .classesHeld(dto.getClassesHeld())
                .classesAttended(dto.getClassesAttended())
                .build();

        return attendanceRepository.save(attendance);
    }
}