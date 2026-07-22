package com.attendance.repo;

import com.attendance.domain.AttendanceEntry;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface AttendanceRepository extends JpaRepository<AttendanceEntry, Long> {
  Optional<AttendanceEntry> findByEmployee_IdAndDate(Long employeeId, LocalDate date);

  List<AttendanceEntry> findAllByEmployee_IdAndDateBetween(
      Long employeeId, LocalDate fromInclusive, LocalDate toInclusive);

  List<AttendanceEntry> findAllByEmployee_IdAndInTimeIsNotNullAndOutTimeIsNullAndDateBefore(
      Long employeeId, LocalDate date);

  List<AttendanceEntry> findAllByInTimeIsNotNullAndOutTimeIsNullAndDateBefore(LocalDate date);

  List<AttendanceEntry> findAllByDateBetween(LocalDate fromInclusive, LocalDate toInclusive);

  List<AttendanceEntry> findAllByTimezoneCorrectedFalse();
}


