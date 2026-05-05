package com.project.Student.Performane.System.repo;


import com.project.Student.Performane.System.Entity.Student;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;

public interface StudentRepository extends JpaRepository<Student, Long> {
    List<Student> findByDepartment(String department);
    List<Student> findBySemester(Integer semester);
    Optional<Student> findByEmail(String email);
}