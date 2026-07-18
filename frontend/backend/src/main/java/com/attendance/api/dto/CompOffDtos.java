package com.attendance.api.dto;

import com.attendance.domain.CompOffRequestStatus;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.time.Instant;
import java.time.LocalDate;

public class CompOffDtos {
  public static class CreateCompOffRequest {
    @NotNull private LocalDate overtimeDate;
    @NotNull private LocalDate requestedDate;
    @NotNull private Integer overtimeMinutes;
    @NotBlank private String reason;
    public LocalDate getOvertimeDate() { return overtimeDate; }
    public void setOvertimeDate(LocalDate overtimeDate) { this.overtimeDate = overtimeDate; }
    public LocalDate getRequestedDate() { return requestedDate; }
    public void setRequestedDate(LocalDate requestedDate) { this.requestedDate = requestedDate; }
    public Integer getOvertimeMinutes() { return overtimeMinutes; }
    public void setOvertimeMinutes(Integer overtimeMinutes) { this.overtimeMinutes = overtimeMinutes; }
    public String getReason() { return reason; }
    public void setReason(String reason) { this.reason = reason; }
  }

  public static class DecideCompOffRequest {
    private String remarks;
    public String getRemarks() { return remarks; }
    public void setRemarks(String remarks) { this.remarks = remarks; }
  }

  public record CompOffResponse(
      Long id,
      Long employeeId,
      String employeeName,
      String employeeNumber,
      LocalDate overtimeDate,
      LocalDate requestedDate,
      Integer overtimeMinutes,
      String reason,
      String attachmentUrl,
      String attachmentName,
      CompOffRequestStatus status,
      Instant createdAt,
      Instant decidedAt,
      String decidedBy,
      String hrRemarks) {}
}
