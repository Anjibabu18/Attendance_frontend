package com.attendance.service;

import com.attendance.domain.AttendanceEntry;
import com.attendance.domain.Employee;
import java.nio.charset.StandardCharsets;
import java.time.YearMonth;
import java.util.List;
import org.springframework.stereotype.Service;

@Service
public class ReportService {
  public byte[] employeePdf(Employee employee, YearMonth month, List<AttendanceEntry> entries) {
    long present = entries.stream().filter(e -> e.getStatus().name().equals("PRESENT")).count();
    long half = entries.stream().filter(e -> e.getStatus().name().equals("HALF_DAY")).count();
    long leave = entries.stream().filter(e -> e.getStatus().name().equals("LEAVE")).count();
    int worked = entries.stream().mapToInt(e -> e.getWorkedMinutes() == null ? 0 : e.getWorkedMinutes()).sum();
    int late = entries.stream().mapToInt(e -> e.getLateMinutes() == null ? 0 : e.getLateMinutes()).sum();
    int overtime = entries.stream().mapToInt(e -> e.getOvertimeMinutes() == null ? 0 : e.getOvertimeMinutes()).sum();
    String text =
        "Attendance Report\\n"
            + "Employee: " + employee.getName() + " (" + employee.getEmployeeNumber() + ")\\n"
            + "Month: " + month + "\\n"
            + "Present: " + present + "  Half day: " + half + "  Leave: " + leave + "\\n"
            + "Worked minutes: " + worked + "  Late minutes: " + late + "  Overtime minutes: " + overtime + "\\n\\n"
            + "Signature: ____________________";
    return simplePdf(text);
  }

  private byte[] simplePdf(String text) {
    String escaped = text.replace("\\", "\\\\").replace("(", "\\(").replace(")", "\\)").replace("\n", ") Tj T* (");
    String stream = "BT /F1 12 Tf 50 760 Td (" + escaped + ") Tj ET";
    String pdf =
        "%PDF-1.4\n"
            + "1 0 obj << /Type /Catalog /Pages 2 0 R >> endobj\n"
            + "2 0 obj << /Type /Pages /Kids [3 0 R] /Count 1 >> endobj\n"
            + "3 0 obj << /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >> endobj\n"
            + "4 0 obj << /Type /Font /Subtype /Type1 /BaseFont /Helvetica >> endobj\n"
            + "5 0 obj << /Length " + stream.getBytes(StandardCharsets.UTF_8).length + " >> stream\n"
            + stream + "\nendstream endobj\n"
            + "xref\n0 6\n0000000000 65535 f \n"
            + "trailer << /Root 1 0 R /Size 6 >>\nstartxref\n0\n%%EOF";
    return pdf.getBytes(StandardCharsets.UTF_8);
  }
}
