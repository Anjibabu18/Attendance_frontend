package com.attendance.service;

import com.attendance.domain.AttendanceBreak;
import com.attendance.domain.Employee;
import com.attendance.repo.AttendanceBreakRepository;
import java.time.Duration;
import java.time.Instant;
import java.time.LocalDate;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class AttendanceBreakService {
  private final AttendanceBreakRepository attendanceBreakRepository;
  private final RealtimeEventService realtimeEventService;

  public AttendanceBreakService(
      AttendanceBreakRepository attendanceBreakRepository, RealtimeEventService realtimeEventService) {
    this.attendanceBreakRepository = attendanceBreakRepository;
    this.realtimeEventService = realtimeEventService;
  }

  public List<AttendanceBreak> today(Employee employee) {
    return attendanceBreakRepository.findAllByEmployee_IdAndDateOrderByBreakStartDesc(employee.getId(), AttendanceClock.today());
  }

  @Transactional
  public AttendanceBreak start(Employee employee) {
    LocalDate today = AttendanceClock.today();
    attendanceBreakRepository.findTopByEmployee_IdAndDateAndBreakEndIsNullOrderByBreakStartDesc(employee.getId(), today)
        .ifPresent(b -> { throw new ApiException(HttpStatus.CONFLICT, "Break already running"); });
    AttendanceBreak b = new AttendanceBreak();
    b.setEmployee(employee);
    b.setDate(today);
    b.setBreakStart(Instant.now());
    AttendanceBreak saved = attendanceBreakRepository.save(b);
    realtimeEventService.publishAttendanceChanged("BREAK_STARTED", employee.getName());
    return saved;
  }

  @Transactional
  public AttendanceBreak end(Employee employee) {
    AttendanceBreak b = attendanceBreakRepository.findTopByEmployee_IdAndDateAndBreakEndIsNullOrderByBreakStartDesc(employee.getId(), AttendanceClock.today())
        .orElseThrow(() -> new ApiException(HttpStatus.CONFLICT, "No running break"));
    b.setBreakEnd(Instant.now());
    AttendanceBreak saved = attendanceBreakRepository.save(b);
    realtimeEventService.publishAttendanceChanged("BREAK_ENDED", employee.getName());
    return saved;
  }

  public long totalMinutes(List<AttendanceBreak> breaks) {
    return breaks.stream()
        .filter(b -> b.getBreakEnd() != null)
        .mapToLong(b -> Duration.between(b.getBreakStart(), b.getBreakEnd()).toMinutes())
        .sum();
  }
}
