package com.attendance.service;

import com.attendance.config.AppConfig;
import com.attendance.domain.AttendanceEntry;
import com.attendance.domain.AttendanceStatus;
import com.attendance.domain.Employee;
import com.attendance.repo.AttendanceRepository;
import com.attendance.repo.EmployeeRepository;
import com.attendance.repo.HolidayRepository;
import java.time.DayOfWeek;
import java.time.Duration;
import java.time.LocalDate;
import java.time.LocalTime;
import java.time.YearMonth;
import java.util.EnumSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class AttendanceService {
  private static final org.slf4j.Logger log = org.slf4j.LoggerFactory.getLogger(AttendanceService.class);

  private final AttendanceRepository attendanceRepository;
  private final EmployeeRepository employeeRepository;
  private final AppConfig appConfig;
  private final HolidayRepository holidayRepository;
  private final AttendanceSettingsService attendanceSettingsService;
  private final PayrollLockService payrollLockService;

  public AttendanceService(
      AttendanceRepository attendanceRepository,
      EmployeeRepository employeeRepository,
      AppConfig appConfig,
      HolidayRepository holidayRepository,
      AttendanceSettingsService attendanceSettingsService,
      PayrollLockService payrollLockService) {
    this.attendanceRepository = attendanceRepository;
    this.employeeRepository = employeeRepository;
    this.appConfig = appConfig;
    this.holidayRepository = holidayRepository;
    this.attendanceSettingsService = attendanceSettingsService;
    this.payrollLockService = payrollLockService;
  }

  @Transactional
  public void autoCheckoutIncompleteEntries(Long employeeId) {
    LocalDate today = AttendanceClock.today();
    List<AttendanceEntry> unclosed = attendanceRepository
        .findAllByEmployee_IdAndInTimeIsNotNullAndOutTimeIsNullAndDateBefore(employeeId, today);
    for (AttendanceEntry entry : unclosed) {
      try {
        log.info("Auto-checking out incomplete entry for employee {} on date {} at 23:59", employeeId, entry.getDate());
        upsert(employeeId, entry.getDate(), entry.getInTime(), LocalTime.of(23, 59), null, true);
      } catch (Exception ex) {
        log.error("Failed to auto checkout entry for employee {} on date {}", employeeId, entry.getDate(), ex);
      }
    }
  }

  @Transactional
  public AttendanceEntry upsert(
      Long employeeId,
      LocalDate date,
      LocalTime inTime,
      LocalTime outTime,
      String leaveReason,
      boolean allowFutureDates) {
    Employee employee =
        employeeRepository
            .findById(employeeId)
            .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Employee not found"));

    LocalDate startDate = effectiveStartDate(employee);
    LocalDate today = AttendanceClock.today();
    if (date.isBefore(startDate)) {
      throw new ApiException(
          HttpStatus.BAD_REQUEST, "Attendance cannot be marked before " + startDate);
    }
    if (!allowFutureDates && date.isAfter(today)) {
      throw new ApiException(HttpStatus.BAD_REQUEST, "Attendance cannot be marked for future dates");
    }
    payrollLockService.assertUnlocked(YearMonth.from(date));

    AttendanceEntry entry =
        attendanceRepository
            .findByEmployee_IdAndDate(employeeId, date)
            .orElseGet(AttendanceEntry::new);
    entry.setEmployee(employee);
    entry.setDate(date);
    entry.setInTime(inTime);
    entry.setOutTime(outTime);
    entry.setTimezoneCorrected(true);

    Integer minutes = computeWorkedMinutes(inTime, outTime);
    entry.setWorkedMinutes(minutes);

    var settings = attendanceSettingsService.get();
    entry.setLateMinutes(computeLateMinutes(inTime, settings.getDefaultInTime(), settings.getLateGraceMinutes()));
    entry.setEarlyLeaveMinutes(
        computeEarlyLeaveMinutes(outTime, settings.getDefaultOutTime(), settings.getEarlyLeaveGraceMinutes()));
    entry.setOvertimeMinutes(computeOvertimeMinutes(minutes, settings.getOvertimeAfterMinutes()));
    int fullDayMinutes =
        settings.getFullDayMinutes() != null && settings.getFullDayMinutes() > 0
            ? settings.getFullDayMinutes()
            : appConfig.getAttendance().getMinDailyMinutes();
    int halfDayMinutes =
        settings.getHalfDayMinutes() != null && settings.getHalfDayMinutes() > 0
            ? settings.getHalfDayMinutes()
            : Math.max(1, fullDayMinutes / 2);
    if (halfDayMinutes > fullDayMinutes) halfDayMinutes = Math.max(1, fullDayMinutes / 2);

    AttendanceStatus status = AttendanceStatus.LEAVE;
    if (minutes != null) {
      if (minutes >= fullDayMinutes) status = AttendanceStatus.PRESENT;
      else if (minutes >= halfDayMinutes) status = AttendanceStatus.HALF_DAY;
    } else if (inTime != null && outTime == null) {
      // In-progress day: checked-in but not checked-out yet.
      // Use PRESENT so the UI doesn't show it as Leave during the day.
      status = AttendanceStatus.PRESENT;
    }

    entry.setStatus(status);
    if (status == AttendanceStatus.LEAVE) {
      // Require a reason only when explicitly marking Leave (no in/out time).
      if (inTime == null && outTime == null) {
        String normalizedReason = leaveReason == null ? "" : leaveReason.trim();
        if (normalizedReason.isBlank()) {
          throw new ApiException(HttpStatus.BAD_REQUEST, "Leave reason is required for leave day");
        }
        entry.setLeaveReason(normalizedReason);
      } else {
        entry.setLeaveReason(null);
      }
    } else {
      entry.setLeaveReason(null);
    }
    return attendanceRepository.save(entry);
  }

  @Transactional
  public List<AttendanceEntry> listForMonth(Long employeeId, YearMonth month) {
    autoCheckoutIncompleteEntries(employeeId);
    Employee employee =
        employeeRepository
            .findById(employeeId)
            .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Employee not found"));

    LocalDate from = max(month.atDay(1), effectiveStartDate(employee));
    LocalDate to = month.atEndOfMonth();
    return attendanceRepository.findAllByEmployee_IdAndDateBetween(employeeId, from, to);
  }

  @Transactional
  public MonthSummary monthSummary(Long employeeId, YearMonth month) {
    autoCheckoutIncompleteEntries(employeeId);
    Employee employee =
        employeeRepository
            .findById(employeeId)
            .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Employee not found"));

    LocalDate today = AttendanceClock.today();
    LocalDate monthStart = month.atDay(1);
    LocalDate monthEnd = month.atEndOfMonth();
    LocalDate toDate = min(today, monthEnd);
    LocalDate fromDate = max(monthStart, effectiveStartDate(employee));

    if (toDate.isBefore(fromDate)) {
      return new MonthSummary(fromDate, toDate, 0, 0, 0, 0, 0);
    }

    List<AttendanceEntry> entries = attendanceRepository.findAllByEmployee_IdAndDateBetween(employeeId, fromDate, toDate);
    Map<LocalDate, AttendanceEntry> byDate =
        entries.stream().collect(java.util.stream.Collectors.toMap(AttendanceEntry::getDate, e -> e, (a, b) -> a));

    EnumSet<DayOfWeek> weekend = weekendDays();
    Set<LocalDate> holidays =
        holidayRepository.findAllByDateBetween(fromDate, toDate).stream()
            .map(com.attendance.domain.Holiday::getDate)
            .collect(java.util.stream.Collectors.toSet());
    int workingDays = 0;
    int presentDays = 0;
    int halfDayDays = 0;
    int totalWorkedMinutes = 0;

    for (LocalDate d = fromDate; !d.isAfter(toDate); d = d.plusDays(1)) {
      if (weekend.contains(d.getDayOfWeek()) || holidays.contains(d)) continue;
      workingDays++;
      AttendanceEntry entry = byDate.get(d);
      if (entry != null) {
        if (entry.getStatus() == AttendanceStatus.PRESENT) {
          presentDays++;
        } else if (entry.getStatus() == AttendanceStatus.HALF_DAY) {
          halfDayDays++;
        }
      }
      if (entry != null && entry.getWorkedMinutes() != null) {
        totalWorkedMinutes += entry.getWorkedMinutes();
      }
    }
    int leaveDays = Math.max(0, workingDays - presentDays - halfDayDays);
    return new MonthSummary(
        fromDate, toDate, workingDays, presentDays, halfDayDays, leaveDays, totalWorkedMinutes);
  }

  public boolean isWorkingDay(LocalDate date) {
    if (weekendDays().contains(date.getDayOfWeek())) return false;
    return holidayRepository.findByDate(date).isEmpty();
  }

  public LocalDate attendanceStartDate(Long employeeId) {
    Employee employee =
        employeeRepository
            .findById(employeeId)
            .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Employee not found"));
    return effectiveStartDate(employee);
  }

  private EnumSet<DayOfWeek> weekendDays() {
    String raw = attendanceSettingsService.get().getWeekendDays();
    if (raw == null || raw.isBlank()) return EnumSet.of(DayOfWeek.SUNDAY);
    EnumSet<DayOfWeek> set = EnumSet.noneOf(DayOfWeek.class);
    for (String part : raw.split(",")) {
      String p = part.trim().toUpperCase();
      if (p.isBlank()) continue;
      try {
        set.add(DayOfWeek.valueOf(p));
      } catch (Exception ignored) {
        // ignore invalid values
      }
    }
    if (set.isEmpty()) set.add(DayOfWeek.SUNDAY);
    return set;
  }

  private LocalDate parseDefaultJoinDate() {
    String raw = appConfig.getAttendance().getDefaultJoinDate();
    if (raw == null || raw.isBlank()) return AttendanceClock.today();
    try {
      return LocalDate.parse(raw.trim());
    } catch (Exception ignored) {
      return AttendanceClock.today();
    }
  }

  private static LocalDate min(LocalDate a, LocalDate b) {
    return a.isBefore(b) ? a : b;
  }

  private static LocalDate max(LocalDate a, LocalDate b) {
    return a.isAfter(b) ? a : b;
  }

  private LocalDate effectiveStartDate(Employee employee) {
    LocalDate joinDate = employee.getJoinDate();
    if (joinDate == null) joinDate = parseDefaultJoinDate();
    return joinDate;
  }

  private static Integer computeWorkedMinutes(LocalTime inTime, LocalTime outTime) {
    if (inTime == null || outTime == null) return null;
    long minutes = Duration.between(inTime, outTime).toMinutes();
    if (minutes < 0) minutes += 24L * 60L;
    return (int) minutes;
  }

  private static Integer computeLateMinutes(
      LocalTime inTime, LocalTime defaultInTime, Integer graceMinutes) {
    if (inTime == null || defaultInTime == null) return 0;
    long minutes = Duration.between(defaultInTime, inTime).toMinutes();
    return (int) Math.max(0, minutes - safeGrace(graceMinutes));
  }

  private static Integer computeEarlyLeaveMinutes(
      LocalTime outTime, LocalTime defaultOutTime, Integer graceMinutes) {
    if (outTime == null || defaultOutTime == null) return 0;
    long minutes = Duration.between(outTime, defaultOutTime).toMinutes();
    if (minutes < -12L * 60L) minutes += 24L * 60L;
    return (int) Math.max(0, minutes - safeGrace(graceMinutes));
  }

  private static Integer computeOvertimeMinutes(Integer workedMinutes, Integer overtimeAfterMinutes) {
    if (workedMinutes == null || overtimeAfterMinutes == null || overtimeAfterMinutes <= 0) return 0;
    return Math.max(0, workedMinutes - overtimeAfterMinutes);
  }

  private static int safeGrace(Integer value) {
    return value == null ? 0 : Math.max(0, value);
  }

  @org.springframework.context.event.EventListener(org.springframework.boot.context.event.ApplicationReadyEvent.class)
  @Transactional
  public void migrateTimezones() {
    // Check if we need to revert the incorrect double-conversion.
    // If today's entry (2026-06-13) has an inTime after 12:00 PM (e.g. 15:16:00), it was double-corrected.
    List<AttendanceEntry> todayEntries = attendanceRepository.findAllByDateBetween(LocalDate.of(2026, 6, 13), LocalDate.of(2026, 6, 13));
    boolean needsReversion = false;
    for (AttendanceEntry entry : todayEntries) {
      if (entry.getInTime() != null && entry.getInTime().isAfter(LocalTime.of(12, 0))) {
        needsReversion = true;
        break;
      }
    }

    if (needsReversion) {
      log.info("Detected double timezone correction. Reverting all entries in database by subtracting 5.5 hours to align with container JRE timezone.");
      List<AttendanceEntry> allEntries = attendanceRepository.findAll();
      for (AttendanceEntry entry : allEntries) {
        if (entry.getInTime() != null) {
          entry.setInTime(entry.getInTime().minusHours(5).minusMinutes(30));
        }
        if (entry.getOutTime() != null) {
          entry.setOutTime(entry.getOutTime().minusHours(5).minusMinutes(30));
        }
        // Recompute worked minutes and stats based on the correct LocalTime
        if (entry.getInTime() != null) {
          Integer minutes = computeWorkedMinutes(entry.getInTime(), entry.getOutTime());
          entry.setWorkedMinutes(minutes);
          var settings = attendanceSettingsService.get();
          entry.setLateMinutes(computeLateMinutes(entry.getInTime(), settings.getDefaultInTime(), settings.getLateGraceMinutes()));
          entry.setEarlyLeaveMinutes(
              computeEarlyLeaveMinutes(entry.getOutTime(), settings.getDefaultOutTime(), settings.getEarlyLeaveGraceMinutes()));
          entry.setOvertimeMinutes(computeOvertimeMinutes(minutes, settings.getOvertimeAfterMinutes()));
        }
        entry.setTimezoneCorrected(false);
      }
      attendanceRepository.saveAll(allEntries);
      log.info("Reversion of timezone correction completed successfully.");
    }

    // Adjust today's entries that were incorrectly subtracted (meaning they are now before 05:30 AM)
    List<AttendanceEntry> entriesToFix = attendanceRepository.findAllByDateBetween(LocalDate.of(2026, 6, 13), LocalDate.of(2026, 6, 13));
    boolean modifiedAny = false;
    for (AttendanceEntry entry : entriesToFix) {
      if (entry.getInTime() != null && entry.getInTime().isBefore(LocalTime.of(5, 30))) {
        log.info("Restoring incorrectly subtracted check-in time for employee {} on date {}: {} -> {}", 
            entry.getEmployee().getId(), entry.getDate(), entry.getInTime(), entry.getInTime().plusHours(5).plusMinutes(30));
        entry.setInTime(entry.getInTime().plusHours(5).plusMinutes(30));
        if (entry.getOutTime() != null && entry.getOutTime().isBefore(LocalTime.of(5, 30))) {
          entry.setOutTime(entry.getOutTime().plusHours(5).plusMinutes(30));
        }
        Integer minutes = computeWorkedMinutes(entry.getInTime(), entry.getOutTime());
        entry.setWorkedMinutes(minutes);
        var settings = attendanceSettingsService.get();
        entry.setLateMinutes(computeLateMinutes(entry.getInTime(), settings.getDefaultInTime(), settings.getLateGraceMinutes()));
        entry.setEarlyLeaveMinutes(
            computeEarlyLeaveMinutes(entry.getOutTime(), settings.getDefaultOutTime(), settings.getEarlyLeaveGraceMinutes()));
        entry.setOvertimeMinutes(computeOvertimeMinutes(minutes, settings.getOvertimeAfterMinutes()));
        attendanceRepository.save(entry);
        modifiedAny = true;
      }
    }
    if (modifiedAny) {
      log.info("Incorrectly subtracted entries fixed successfully.");
    }
  }

  public record MonthSummary(
      LocalDate fromDate,
      LocalDate toDate,
      int workingDays,
      int presentDays,
      int halfDayDays,
      int leaveDays,
      int totalWorkedMinutes) {}
}


