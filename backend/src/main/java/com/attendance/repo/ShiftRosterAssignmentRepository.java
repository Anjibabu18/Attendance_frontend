package com.attendance.repo;

import com.attendance.domain.ShiftRosterAssignment;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ShiftRosterAssignmentRepository extends JpaRepository<ShiftRosterAssignment, Long> {
  @EntityGraph(attributePaths = {"shift"})
  Optional<ShiftRosterAssignment> findByEmployee_IdAndDate(Long employeeId, LocalDate date);
  @EntityGraph(attributePaths = {"employee", "shift"})
  List<ShiftRosterAssignment> findAllByDateBetweenOrderByDateAsc(LocalDate from, LocalDate to);
  @EntityGraph(attributePaths = {"employee", "shift"})
  List<ShiftRosterAssignment> findAllByEmployee_IdAndDateBetweenOrderByDateAsc(Long employeeId, LocalDate from, LocalDate to);
}
