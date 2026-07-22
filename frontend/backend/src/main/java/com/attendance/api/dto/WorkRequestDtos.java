package com.attendance.api.dto;

import com.attendance.domain.WorkRequestStatus;
import com.attendance.domain.WorkRequestType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.time.Instant;
import java.time.LocalDate;

public class WorkRequestDtos {
  public static class CreateWorkRequest {
    @NotNull private WorkRequestType type;
    @NotNull private LocalDate fromDate;
    @NotNull private LocalDate toDate;
    @NotBlank private String reason;

    public WorkRequestType getType() { return type; }
    public void setType(WorkRequestType type) { this.type = type; }
    public LocalDate getFromDate() { return fromDate; }
    public void setFromDate(LocalDate fromDate) { this.fromDate = fromDate; }
    public LocalDate getToDate() { return toDate; }
    public void setToDate(LocalDate toDate) { this.toDate = toDate; }
    public String getReason() { return reason; }
    public void setReason(String reason) { this.reason = reason; }
  }

  public static class DecideWorkRequest {
    private String remarks;
    public String getRemarks() { return remarks; }
    public void setRemarks(String remarks) { this.remarks = remarks; }
  }

  public record WorkRequestResponse(
      Long id,
      Long employeeId,
      String employeeName,
      String employeeNumber,
      WorkRequestType type,
      LocalDate fromDate,
      LocalDate toDate,
      String reason,
      WorkRequestStatus status,
      Instant createdAt,
      Instant decidedAt,
      String decidedBy,
      String remarks,
      String attachmentUrl,
      String attachmentName) {}
}
