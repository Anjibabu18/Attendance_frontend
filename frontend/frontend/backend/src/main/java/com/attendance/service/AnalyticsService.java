package com.attendance.service;

import com.attendance.domain.AttendanceStatus;
import com.attendance.domain.Employee;
import com.attendance.repo.AttendanceRepository;
import com.attendance.repo.EmployeeRepository;
import java.time.LocalDate;
import java.time.YearMonth;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class AnalyticsService {
  private final EmployeeRepository employeeRepository;
  private final AttendanceRepository attendanceRepository;

  public AnalyticsService(EmployeeRepository employeeRepository, AttendanceRepository attendanceRepository) {
    this.employeeRepository = employeeRepository;
    this.attendanceRepository = attendanceRepository;
  }

  @Transactional(readOnly = true)
  public Map<String, Object> month(YearMonth month) {
    var entries = attendanceRepository.findAllByDateBetween(month.atDay(1), month.atEndOfMonth());
    List<Employee> employees = employeeRepository.findAll();
    long present = entries.stream().filter(e -> e.getStatus() == AttendanceStatus.PRESENT).count();
    long half = entries.stream().filter(e -> e.getStatus() == AttendanceStatus.HALF_DAY).count();
    long leave = entries.stream().filter(e -> e.getStatus() == AttendanceStatus.LEAVE).count();
    int late = entries.stream().mapToInt(e -> e.getLateMinutes() == null ? 0 : e.getLateMinutes()).sum();
    int overtime = entries.stream().mapToInt(e -> e.getOvertimeMinutes() == null ? 0 : e.getOvertimeMinutes()).sum();
    Map<String, Integer> lateTrend =
        entries.stream()
            .collect(
                Collectors.groupingBy(
                    e -> e.getDate(),
                    Collectors.summingInt(e -> e.getLateMinutes() == null ? 0 : e.getLateMinutes())))
            .entrySet().stream()
            .sorted(Map.Entry.comparingByKey())
            .collect(
                Collectors.toMap(
                    e -> e.getKey().toString(),
                    Map.Entry::getValue,
                    (a, b) -> a,
                    LinkedHashMap::new));
    Map<String, Long> leaveTrend =
        entries.stream()
            .filter(e -> e.getStatus() == AttendanceStatus.LEAVE)
            .collect(Collectors.groupingBy(e -> e.getDate(), Collectors.counting()))
            .entrySet().stream()
            .sorted(Map.Entry.comparingByKey())
            .collect(
                Collectors.toMap(
                    e -> e.getKey().toString(),
                    Map.Entry::getValue,
                    (a, b) -> a,
                    LinkedHashMap::new));
    Map<String, Long> departmentAttendance =
        entries.stream()
            .filter(e -> e.getStatus() == AttendanceStatus.PRESENT)
            .collect(
                Collectors.groupingBy(
                    e ->
                        e.getEmployee().getDepartment() == null
                            ? "Unassigned"
                            : e.getEmployee().getDepartment().getName(),
                    Collectors.counting()));
    Map<String, Long> officeOccupancy =
        employees.stream()
            .collect(
                Collectors.groupingBy(
                    e ->
                        e.getAssignedOfficeLocation() == null
                            ? "Default office"
                            : (e.getAssignedOfficeLocation().getOfficeName() == null
                                ? "Office #" + e.getAssignedOfficeLocation().getId()
                                : e.getAssignedOfficeLocation().getOfficeName()),
                    Collectors.counting()));
    LocalDate lastDate = entries.stream().map(e -> e.getDate()).max(Comparator.naturalOrder()).orElse(month.atEndOfMonth());
    long todayPresent =
        entries.stream().filter(e -> e.getDate().equals(lastDate) && e.getStatus() == AttendanceStatus.PRESENT).count();
    Map<String, Object> out = new LinkedHashMap<>();
    out.put("employees", employeeRepository.count());
    out.put("presentEntries", present);
    out.put("halfDayEntries", half);
    out.put("leaveEntries", leave);
    out.put("lateMinutes", late);
    out.put("overtimeMinutes", overtime);
    out.put("todayPresent", todayPresent);
    out.put("lateTrend", lateTrend);
    out.put("leaveTrend", leaveTrend);
    out.put("departmentAttendance", departmentAttendance);
    out.put("officeOccupancy", officeOccupancy);
    return out;
  }
}
