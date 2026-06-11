package com.attendance.repo;

import com.attendance.domain.AttendanceException;
import java.util.List;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

public interface AttendanceExceptionRepository extends JpaRepository<AttendanceException, Long> {
  @EntityGraph(attributePaths = "employee")
  List<AttendanceException> findTop100ByResolvedFalseOrderByCreatedAtDesc();
}
