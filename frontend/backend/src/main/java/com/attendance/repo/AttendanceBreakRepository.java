package com.attendance.repo;

import com.attendance.domain.AttendanceBreak;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

public interface AttendanceBreakRepository extends JpaRepository<AttendanceBreak, Long> {
  @EntityGraph(attributePaths = "employee")
  List<AttendanceBreak> findAllByEmployee_IdAndDateOrderByBreakStartDesc(Long employeeId, LocalDate date);

  @EntityGraph(attributePaths = "employee")
  List<AttendanceBreak> findAllByDateOrderByBreakStartDesc(LocalDate date);

  @EntityGraph(attributePaths = "employee")
  List<AttendanceBreak> findAllByDateAndBreakEndIsNull(LocalDate date);

  @EntityGraph(attributePaths = "employee")
  Optional<AttendanceBreak> findTopByEmployee_IdAndDateAndBreakEndIsNullOrderByBreakStartDesc(Long employeeId,
      LocalDate date);
}
