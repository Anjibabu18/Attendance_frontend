package com.attendance.service;

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
  private static final double DEFAULT_MONTHLY_SALARY = 25000d;

  private final EmployeeRepository employeeRepository;
  private final AttendanceRepository attendanceRepository;
  private final AttendanceSettingsService settingsService;
  private final AttendanceService attendanceService;

  public PayrollService(
      EmployeeRepository employeeRepository,
      AttendanceRepository attendanceRepository,
      AttendanceSettingsService settingsService,
      AttendanceService attendanceService) {
    this.employeeRepository = employeeRepository;
    this.attendanceRepository = attendanceRepository;
    this.settingsService = settingsService;
    this.attendanceService = attendanceService;
  }

  public Map<String, Object> employeePayslip(Long employeeId, YearMonth month) {
    Employee employee =
        employeeRepository.findById(employeeId).orElseThrow(() -> new ApiException(org.springframework.http.HttpStatus.NOT_FOUND, "Employee not found"));
    var settings = settingsService.get();
    var summary = attendanceService.monthSummary(employeeId, month);
    var entries = attendanceRepository.findAllByEmployee_IdAndDateBetween(employeeId, month.atDay(1), month.atEndOfMonth());
    int present = summary.presentDays();
    int halfDay = summary.halfDayDays();
    int leave = summary.leaveDays();
    int workingDays = summary.workingDays();
    int lateMinutes = entries.stream().mapToInt(a -> a.getLateMinutes() == null ? 0 : a.getLateMinutes()).sum();
    int overtimeMinutes = entries.stream().mapToInt(a -> a.getOvertimeMinutes() == null ? 0 : a.getOvertimeMinutes()).sum();
    double payableDays = present + (halfDay * 0.5d);
    double lateDeduction = lateMinutes * settings.getLateDeductionPerMinute();
    double baseSalary = configuredSalary(settings.getStandardMonthlySalary());
    double dailyRate = workingDays <= 0 ? 0d : baseSalary / workingDays;
    double earnedSalary = dailyRate * payableDays;
    double overtimePay = 0d;
    double unpaidLeaveDeduction = Math.max(0d, baseSalary - earnedSalary);
    double gross = earnedSalary;
    double totalDeductions = lateDeduction + unpaidLeaveDeduction;
    double net = Math.max(0d, earnedSalary - lateDeduction);

    Map<String, Object> payload = new LinkedHashMap<>();
    payload.put("employeeId", employee.getId());
    payload.put("employeeName", employee.getName());
    payload.put("employeeNumber", employee.getEmployeeNumber());
    payload.put("month", month.toString());
    payload.put("presentDays", present);
    payload.put("halfDays", halfDay);
    payload.put("leaveDays", leave);
    payload.put("workingDays", workingDays);
    payload.put("payableDays", payableDays);
    payload.put("lateMinutes", lateMinutes);
    payload.put("overtimeMinutes", overtimeMinutes);
    payload.put("baseSalary", baseSalary);
    payload.put("dailyRate", round(dailyRate));
    payload.put("earnedSalary", round(earnedSalary));
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

  public String monthlyRegisterCsv(YearMonth month) {
    StringBuilder out = new StringBuilder();
    out.append("Employee Number,Employee Name,Month,Working Days,Present Days,Half Days,Leave Days,Payable Days,Late Minutes,Overtime Minutes,Base Salary,Daily Rate,Earned Salary,Late Deduction,Unpaid Leave Deduction,Overtime Pay,Gross Pay,Total Deductions,Net Pay\n");
    for (Map<String, Object> row : monthlyRegister(month)) {
      out.append(csv(row.get("employeeNumber"))).append(',')
          .append(csv(row.get("employeeName"))).append(',')
          .append(csv(row.get("month"))).append(',')
          .append(csv(row.get("workingDays"))).append(',')
          .append(csv(row.get("presentDays"))).append(',')
          .append(csv(row.get("halfDays"))).append(',')
          .append(csv(row.get("leaveDays"))).append(',')
          .append(csv(row.get("payableDays"))).append(',')
          .append(csv(row.get("lateMinutes"))).append(',')
          .append(csv(row.get("overtimeMinutes"))).append(',')
          .append(csv(row.get("baseSalary"))).append(',')
          .append(csv(row.get("dailyRate"))).append(',')
          .append(csv(row.get("earnedSalary"))).append(',')
          .append(csv(row.get("lateDeduction"))).append(',')
          .append(csv(row.get("unpaidLeaveDeduction"))).append(',')
          .append(csv(row.get("overtimePay"))).append(',')
          .append(csv(row.get("grossPay"))).append(',')
          .append(csv(row.get("totalDeductions"))).append(',')
          .append(csv(row.get("netPay"))).append('\n');
    }
    return out.toString();
  }
  private static String csv(Object value) {
    if (value == null) return "";
    String s = String.valueOf(value);
    boolean quote = s.contains(",") || s.contains("\"") || s.contains("\n") || s.contains("\r");
    s = s.replace("\"", "\"\"");
    return quote ? "\"" + s + "\"" : s;
  }
  private static double round(double value) {
    return Math.round(value * 100d) / 100d;
  }

  private static double configuredSalary(Double value) {
    return value == null || value <= 0 ? DEFAULT_MONTHLY_SALARY : value;
  }
}


