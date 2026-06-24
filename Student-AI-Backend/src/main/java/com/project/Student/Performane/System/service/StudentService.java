package com.project.Student.Performane.System.service;



import com.project.Student.Performane.System.dto.StudentDTO;
import com.project.Student.Performane.System.Entity.Student;
import com.project.Student.Performane.System.repo.StudentRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import java.util.List;

@Service
@RequiredArgsConstructor
public class StudentService {

    private final StudentRepository studentRepository;

    public Student createStudent(StudentDTO dto) {
        Student student = Student.builder()
                .name(dto.getName())
                .email(dto.getEmail())
                .enrollmentNumber(dto.getEnrollmentNumber())
                .department(dto.getDepartment())
                .semester(dto.getSemester())
                .dateOfBirth(dto.getDateOfBirth())
                .build();
        return studentRepository.save(student);
    }

    public Student getStudent(Long id) {
        return studentRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Student not found: " + id));
    }

    public List<Student> getAllStudents() {
        return studentRepository.findAll();
    }

    public Student updateStudent(Long id, StudentDTO dto) {
        Student student = getStudent(id);
        student.setName(dto.getName());
        student.setDepartment(dto.getDepartment());
        student.setSemester(dto.getSemester());
        return studentRepository.save(student);
    }

    public void deleteStudent(Long id) {
        studentRepository.deleteById(id);
    }
}
