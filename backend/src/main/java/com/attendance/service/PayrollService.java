package com.attendance.service;

import com.attendance.domain.AttendanceStatus;
import com.attendance.domain.Employee;
import com.attendance.repo.AttendanceRepository;
import com.attendance.repo.EmployeeRepository;
import java.time.YearMonth;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import org.springframework.stereotype.Service;

@Service
public class PayrollService {
  private final EmployeeRepository employeeRepository;
  private final AttendanceRepository attendanceRepository;
  private final AttendanceSettingsService settingsService;

  public PayrollService(
      EmployeeRepository employeeRepository,
      AttendanceRepository attendanceRepository,
      AttendanceSettingsService settingsService) {
    this.employeeRepository = employeeRepository;
    this.attendanceRepository = attendanceRepository;
    this.settingsService = settingsService;
  }

  public Map<String, Object> employeePayslip(Long employeeId, YearMonth month) {
    Employee employee =
        employeeRepository.findById(employeeId).orElseThrow(() -> new ApiException(org.springframework.http.HttpStatus.NOT_FOUND, "Employee not found"));
    var settings = settingsService.get();
    var entries = attendanceRepository.findAllByEmployee_IdAndDateBetween(employeeId, month.atDay(1), month.atEndOfMonth());
    long present = entries.stream().filter(a -> a.getStatus() == AttendanceStatus.PRESENT).count();
    long halfDay = entries.stream().filter(a -> a.getStatus() == AttendanceStatus.HALF_DAY).count();
    long leave = entries.stream().filter(a -> a.getStatus() == AttendanceStatus.LEAVE).count();
    int lateMinutes = entries.stream().mapToInt(a -> a.getLateMinutes() == null ? 0 : a.getLateMinutes()).sum();
    int overtimeMinutes = entries.stream().mapToInt(a -> a.getOvertimeMinutes() == null ? 0 : a.getOvertimeMinutes()).sum();
    double payableDays = present + (halfDay * 0.5d);
    double lateDeduction = lateMinutes * settings.getLateDeductionPerMinute();
    double overtimePay = (overtimeMinutes / 60d) * settings.getOvertimePayPerHour();
    double unpaidLeaveDeduction = leave * settings.getUnpaidLeaveDailyRate();
    double gross = settings.getStandardMonthlySalary() + overtimePay;
    double totalDeductions = lateDeduction + unpaidLeaveDeduction;
    double net = gross - totalDeductions;

    Map<String, Object> payload = new LinkedHashMap<>();
    payload.put("employeeId", employee.getId());
    payload.put("employeeName", employee.getName());
    payload.put("employeeNumber", employee.getEmployeeNumber());
    payload.put("month", month.toString());
    payload.put("presentDays", present);
    payload.put("halfDays", halfDay);
    payload.put("leaveDays", leave);
    payload.put("payableDays", payableDays);
    payload.put("lateMinutes", lateMinutes);
    payload.put("overtimeMinutes", overtimeMinutes);
    payload.put("baseSalary", settings.getStandardMonthlySalary());
    payload.put("lateDeduction", round(lateDeduction));
    payload.put("unpaidLeaveDeduction", round(unpaidLeaveDeduction));
    payload.put("overtimePay", round(overtimePay));
    payload.put("grossPay", round(gross));
    payload.put("totalDeductions", round(totalDeductions));
    payload.put("netPay", round(net));
    return payload;
  }

  public List<Map<String, Object>> monthlyRegister(YearMonth month) {
    return employeeRepository.findAll().stream()
        .map(e -> employeePayslip(e.getId(), month))
        .toList();
  }

  private static double round(double value) {
    return Math.round(value * 100d) / 100d;
  }
}
