package com.attendance.service;

import com.attendance.domain.AttendanceEntry;
import com.attendance.domain.Employee;
import com.attendance.repo.AttendanceBreakRepository;
import com.attendance.repo.AttendanceRepository;
import com.attendance.repo.EmployeeRepository;
import com.attendance.repo.PunchAttemptRepository;
import java.time.LocalDate;
import java.time.LocalTime;
import java.time.YearMonth;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.function.Function;
import java.util.stream.Collectors;
import org.springframework.stereotype.Service;

@Service
public class RealtimeAttendanceService {
  private final EmployeeRepository employeeRepository;
  private final AttendanceRepository attendanceRepository;
  private final AttendanceBreakRepository attendanceBreakRepository;
  private final PunchAttemptRepository punchAttemptRepository;
  private final AttendanceSettingsService settingsService;

  public RealtimeAttendanceService(
      EmployeeRepository employeeRepository,
      AttendanceRepository attendanceRepository,
      AttendanceBreakRepository attendanceBreakRepository,
      PunchAttemptRepository punchAttemptRepository,
      AttendanceSettingsService settingsService) {
    this.employeeRepository = employeeRepository;
    this.attendanceRepository = attendanceRepository;
    this.attendanceBreakRepository = attendanceBreakRepository;
    this.punchAttemptRepository = punchAttemptRepository;
    this.settingsService = settingsService;
  }

  public Map<String, Object> board() {
    LocalDate today = AttendanceClock.today();
    LocalTime now = AttendanceClock.now();
    List<Employee> employees = employeeRepository.findAll();
    Map<Long, AttendanceEntry> attendance =
        attendanceRepository.findAllByDateBetween(today, today).stream()
            .collect(Collectors.toMap(e -> e.getEmployee().getId(), Function.identity(), (a, b) -> a));
    var openBreakEmployeeIds =
        attendanceBreakRepository.findAllByDateAndBreakEndIsNull(today).stream()
            .map(b -> b.getEmployee().getId())
            .collect(Collectors.toSet());
    var todaysBreaks = attendanceBreakRepository.findAllByDateOrderByBreakStartDesc(today);
    var recentAttempts =
        punchAttemptRepository.findTop50ByCreatedAtAfterOrderByCreatedAtDesc(
            java.time.Instant.now().minus(java.time.Duration.ofHours(24)));

    int checkedIn = 0, checkedOut = 0, onBreak = 0, absent = 0, late = 0;
    List<Map<String, Object>> rows = new ArrayList<>();
    List<Map<String, Object>> mapPoints = new ArrayList<>();
    List<Map<String, Object>> correctionAlerts = new ArrayList<>();
    LocalTime defaultIn = settingsService.get().getDefaultInTime();
    LocalTime defaultOut = settingsService.get().getDefaultOutTime();
    int grace = settingsService.get().getLateGraceMinutes();
    LocalTime lateAfter = defaultIn.plusMinutes(grace);

    for (Employee e : employees) {
      AttendanceEntry a = attendance.get(e.getId());
      boolean hasIn = a != null && a.getInTime() != null;
      boolean hasOut = a != null && a.getOutTime() != null;
      boolean breakOpen = openBreakEmployeeIds.contains(e.getId());
      String status;
      if (breakOpen) {
        status = "ON_BREAK";
        onBreak++;
      } else if (hasOut) {
        status = "CHECKED_OUT";
        checkedOut++;
      } else if (hasIn) {
        status = "CHECKED_IN";
        checkedIn++;
      } else {
        status = now.isAfter(lateAfter) ? "LATE_ALERT" : "NOT_ARRIVED";
        absent++;
        if ("LATE_ALERT".equals(status)) late++;
      }
      rows.add(row(e, a, status));
      if (hasIn && !hasOut && now.isAfter(defaultOut.plusMinutes(60))) {
        correctionAlerts.add(alert(e, "MISSING_CHECKOUT", "Checked in but checkout is still missing"));
      }
      if (a != null && a.getWorkedMinutes() != null && a.getWorkedMinutes() > 0 && a.getWorkedMinutes() < settingsService.get().getHalfDayMinutes()) {
        correctionAlerts.add(alert(e, "SHORT_WORK_DURATION", "Worked minutes are below half-day threshold"));
      }
      if (a != null && a.getCheckInLatitude() != null && a.getCheckInLongitude() != null) {
        mapPoints.add(Map.of("employeeName", e.getName(), "office", officeName(e), "latitude", a.getCheckInLatitude(), "longitude", a.getCheckInLongitude(), "type", "CHECK_IN"));
      }
      if (a != null && a.getCheckOutLatitude() != null && a.getCheckOutLongitude() != null) {
        mapPoints.add(Map.of("employeeName", e.getName(), "office", officeName(e), "latitude", a.getCheckOutLatitude(), "longitude", a.getCheckOutLongitude(), "type", "CHECK_OUT"));
      }
    }

    List<Map<String, Object>> outsideAttempts =
        recentAttempts.stream()
            .filter(p -> !p.isSuccess())
            .map(
                p -> {
                  Map<String, Object> item = new LinkedHashMap<>();
                  item.put("employeeName", p.getEmployee() == null ? "--" : p.getEmployee().getName());
                  item.put("employeeNumber", p.getEmployee() == null ? "--" : p.getEmployee().getEmployeeNumber());
                  item.put("type", p.getType());
                  item.put("message", safe(p.getMessage()));
                  item.put("distanceMeters", p.getDistanceMeters() == null ? 0 : Math.round(p.getDistanceMeters()));
                  item.put("createdAt", p.getCreatedAt());
                  return item;
                })
            .toList();

    Map<String, Object> out = new LinkedHashMap<>();
    out.put("generatedAt", java.time.Instant.now());
    out.put("summary", Map.of("employees", employees.size(), "checkedIn", checkedIn, "checkedOut", checkedOut, "onBreak", onBreak, "absentOrNotArrived", absent, "lateAlerts", late));
    out.put("rows", rows);
    out.put("occupancy", occupancy(rows));
    out.put("alerts", alerts(rows));
    out.put("mapPoints", mapPoints);
    out.put("outsideAttempts", outsideAttempts);
    out.put("timeline", timeline(recentAttempts, todaysBreaks));
    out.put("correctionAlerts", correctionAlerts);
    out.put("suspicious", suspicious(recentAttempts));
    out.put("payrollPreview", payrollPreview(YearMonth.from(today)));
    return out;
  }

  public Map<String, Object> payrollPreview(YearMonth month) {
    List<Map<String, Object>> rows = new ArrayList<>();
    int totalWorked = 0, totalLate = 0, totalOvertime = 0;
    long totalPresent = 0, totalHalf = 0, totalLeave = 0;
    for (Employee e : employeeRepository.findAll()) {
      var entries = attendanceRepository.findAllByEmployee_IdAndDateBetween(e.getId(), month.atDay(1), month.atEndOfMonth());
      long present = entries.stream().filter(a -> a.getStatus().name().equals("PRESENT")).count();
      long half = entries.stream().filter(a -> a.getStatus().name().equals("HALF_DAY")).count();
      long leave = entries.stream().filter(a -> a.getStatus().name().equals("LEAVE")).count();
      int worked = entries.stream().mapToInt(a -> a.getWorkedMinutes() == null ? 0 : a.getWorkedMinutes()).sum();
      int late = entries.stream().mapToInt(a -> a.getLateMinutes() == null ? 0 : a.getLateMinutes()).sum();
      int ot = entries.stream().mapToInt(a -> a.getOvertimeMinutes() == null ? 0 : a.getOvertimeMinutes()).sum();
      totalPresent += present;
      totalHalf += half;
      totalLeave += leave;
      totalWorked += worked;
      totalLate += late;
      totalOvertime += ot;
      rows.add(
          Map.of(
              "employeeNumber", e.getEmployeeNumber(),
              "employeeName", e.getName(),
              "department", e.getDepartment() == null ? "--" : e.getDepartment().getName(),
              "present", present,
              "halfDay", half,
              "leave", leave,
              "workedMinutes", worked,
              "lateMinutes", late,
              "overtimeMinutes", ot));
    }
    return Map.of(
        "month", month.toString(),
        "totals",
            Map.of(
                "present", totalPresent,
                "halfDay", totalHalf,
                "leave", totalLeave,
                "workedMinutes", totalWorked,
                "lateMinutes", totalLate,
                "overtimeMinutes", totalOvertime),
        "rows", rows);
  }

  public String payrollCsv(YearMonth month) {
    StringBuilder sb = new StringBuilder("Employee No,Name,Present,Half Day,Leave,Worked Minutes,Late Minutes,Overtime Minutes\n");
    for (Employee e : employeeRepository.findAll()) {
      var entries = attendanceRepository.findAllByEmployee_IdAndDateBetween(e.getId(), month.atDay(1), month.atEndOfMonth());
      long present = entries.stream().filter(a -> a.getStatus().name().equals("PRESENT")).count();
      long half = entries.stream().filter(a -> a.getStatus().name().equals("HALF_DAY")).count();
      long leave = entries.stream().filter(a -> a.getStatus().name().equals("LEAVE")).count();
      int worked = entries.stream().mapToInt(a -> a.getWorkedMinutes() == null ? 0 : a.getWorkedMinutes()).sum();
      int late = entries.stream().mapToInt(a -> a.getLateMinutes() == null ? 0 : a.getLateMinutes()).sum();
      int ot = entries.stream().mapToInt(a -> a.getOvertimeMinutes() == null ? 0 : a.getOvertimeMinutes()).sum();
      sb.append(csv(e.getEmployeeNumber())).append(',').append(csv(e.getName())).append(',').append(present).append(',').append(half).append(',').append(leave).append(',').append(worked).append(',').append(late).append(',').append(ot).append('\n');
    }
    return sb.toString();
  }

  private static Map<String, Object> row(Employee e, AttendanceEntry a, String status) {
    Map<String, Object> out = new LinkedHashMap<>();
    out.put("employeeId", e.getId());
    out.put("employeeNumber", e.getEmployeeNumber());
    out.put("employeeName", e.getName());
    out.put("department", e.getDepartment() == null ? "--" : e.getDepartment().getName());
    out.put("office", officeName(e));
    out.put("status", status);
    out.put("inTime", a == null || a.getInTime() == null ? "--" : a.getInTime().toString());
    out.put("outTime", a == null || a.getOutTime() == null ? "--" : a.getOutTime().toString());
    out.put("workedMinutes", a == null || a.getWorkedMinutes() == null ? 0 : a.getWorkedMinutes());
    out.put("lateMinutes", a == null || a.getLateMinutes() == null ? 0 : a.getLateMinutes());
    out.put("overtimeMinutes", a == null || a.getOvertimeMinutes() == null ? 0 : a.getOvertimeMinutes());
    return out;
  }

  private static List<Map<String, Object>> alerts(List<Map<String, Object>> rows) {
    return rows.stream().filter(r -> "LATE_ALERT".equals(r.get("status"))).limit(20).toList();
  }

  private static Map<String, Long> occupancy(List<Map<String, Object>> rows) {
    return rows.stream()
        .filter(r -> "CHECKED_IN".equals(r.get("status")) || "ON_BREAK".equals(r.get("status")))
        .collect(Collectors.groupingBy(r -> String.valueOf(r.get("office")), LinkedHashMap::new, Collectors.counting()));
  }

  private static List<Map<String, Object>> timeline(
      List<com.attendance.domain.PunchAttempt> attempts,
      List<com.attendance.domain.AttendanceBreak> breaks) {
    List<Map<String, Object>> items = new ArrayList<>();
    for (var p : attempts) {
      Employee e = p.getEmployee();
      items.add(
          Map.of(
              "at", p.getCreatedAt(),
              "type", p.getType(),
              "employeeName", e == null ? "--" : e.getName(),
              "employeeNumber", e == null ? "--" : e.getEmployeeNumber(),
              "message", safe(p.getMessage()),
              "success", p.isSuccess()));
    }
    for (var b : breaks) {
      Employee e = b.getEmployee();
      items.add(
          Map.of(
              "at", b.getBreakStart(),
              "type", "BREAK_STARTED",
              "employeeName", e.getName(),
              "employeeNumber", e.getEmployeeNumber(),
              "message", "Break started",
              "success", true));
      if (b.getBreakEnd() != null) {
        items.add(
            Map.of(
                "at", b.getBreakEnd(),
                "type", "BREAK_ENDED",
                "employeeName", e.getName(),
                "employeeNumber", e.getEmployeeNumber(),
                "message", "Break ended",
                "success", true));
      }
    }
    return items.stream()
        .sorted(Comparator.comparing(i -> String.valueOf(i.get("at")), Comparator.reverseOrder()))
        .limit(30)
        .toList();
  }

  private static List<Map<String, Object>> suspicious(List<com.attendance.domain.PunchAttempt> attempts) {
    Map<Long, List<com.attendance.domain.PunchAttempt>> byEmployee =
        attempts.stream()
            .filter(p -> p.getEmployee() != null)
            .collect(Collectors.groupingBy(p -> p.getEmployee().getId()));
    List<Map<String, Object>> out = new ArrayList<>();
    for (var entry : byEmployee.entrySet()) {
      List<com.attendance.domain.PunchAttempt> employeeAttempts = entry.getValue();
      Employee employee = employeeAttempts.get(0).getEmployee();
      long failed = employeeAttempts.stream().filter(p -> !p.isSuccess()).count();
      if (failed >= 2) {
        out.add(alert(employee, "REPEATED_FAILED_GEOFENCE", failed + " failed punch attempts in the last 24 hours"));
      }
      long farAway =
          employeeAttempts.stream()
              .filter(p -> p.getDistanceMeters() != null && p.getDistanceMeters() > 1000)
              .count();
      if (farAway > 0) {
        out.add(alert(employee, "FAR_FROM_OFFICE", "Punch attempt more than 1 km from assigned office"));
      }
    }
    return out;
  }

  private static Map<String, Object> alert(Employee employee, String type, String message) {
    return Map.of(
        "employeeId", employee.getId(),
        "employeeNumber", employee.getEmployeeNumber(),
        "employeeName", employee.getName(),
        "type", type,
        "message", message);
  }

  private static String officeName(Employee employee) {
    if (employee.getAssignedOfficeLocation() == null) return "Default";
    String name = employee.getAssignedOfficeLocation().getOfficeName();
    return name == null || name.isBlank() ? "Office " + employee.getAssignedOfficeLocation().getId() : name;
  }

  private static String safe(String value) {
    return value == null ? "" : value;
  }

  private static String csv(String value) {
    String v = value == null ? "" : value;
    if (v.contains(",") || v.contains("\"") || v.contains("\n")) {
      return "\"" + v.replace("\"", "\"\"") + "\"";
    }
    return v;
  }
}
