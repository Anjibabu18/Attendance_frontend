package com.attendance.service;

import com.attendance.domain.AttendanceEntry;
import com.attendance.domain.Employee;
import java.time.YearMonth;
import java.util.Comparator;
import java.util.List;
import org.springframework.stereotype.Service;

@Service
public class AttendanceExportService {
  public String employeeMonthCsv(Employee employee, YearMonth month, List<AttendanceEntry> entries) {
    StringBuilder out = new StringBuilder();
    out.append("Employee Number,Employee Name,Month\n");
    out.append(csv(employee.getEmployeeNumber()))
        .append(',')
        .append(csv(employee.getName()))
        .append(',')
        .append(csv(month.toString()))
        .append("\n\n");
    out.append(
        "Date,Status,In Time,Out Time,Worked Minutes,Late Minutes,Early Leave Minutes,Overtime Minutes,Leave Reason,Check In Latitude,Check In Longitude,Check Out Latitude,Check Out Longitude,Check In Photo,Check Out Photo\n");

    entries.stream()
        .sorted(Comparator.comparing(AttendanceEntry::getDate))
        .forEach(
            e ->
                out.append(csv(e.getDate()))
                    .append(',')
                    .append(csv(e.getStatus()))
                    .append(',')
                    .append(csv(e.getInTime()))
                    .append(',')
                    .append(csv(e.getOutTime()))
                    .append(',')
                    .append(csv(e.getWorkedMinutes()))
                    .append(',')
                    .append(csv(e.getLateMinutes()))
                    .append(',')
                    .append(csv(e.getEarlyLeaveMinutes()))
                    .append(',')
                    .append(csv(e.getOvertimeMinutes()))
                    .append(',')
                    .append(csv(e.getLeaveReason()))
                    .append(',')
                    .append(csv(e.getCheckInLatitude()))
                    .append(',')
                    .append(csv(e.getCheckInLongitude()))
                    .append(',')
                    .append(csv(e.getCheckOutLatitude()))
                    .append(',')
                    .append(csv(e.getCheckOutLongitude()))
                    .append(',')
                    .append(csv(e.getCheckInPhotoUrl()))
                    .append(',')
                    .append(csv(e.getCheckOutPhotoUrl()))
                    .append('\n'));
    return out.toString();
  }

  public String filename(Employee employee, YearMonth month) {
    String empNo =
        employee.getEmployeeNumber() == null
            ? "employee"
            : employee.getEmployeeNumber().replaceAll("[^A-Za-z0-9_-]", "_");
    return "attendance-" + empNo + "-" + month + ".csv";
  }

  private static String csv(Object value) {
    if (value == null) return "";
    String s = String.valueOf(value);
    boolean quote = s.contains(",") || s.contains("\"") || s.contains("\n") || s.contains("\r");
    s = s.replace("\"", "\"\"");
    return quote ? "\"" + s + "\"" : s;
  }
}
