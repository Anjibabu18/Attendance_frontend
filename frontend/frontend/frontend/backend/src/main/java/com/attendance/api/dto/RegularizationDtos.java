package com.attendance.api.dto;

import com.attendance.domain.RegularizationStatus;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalTime;

public class RegularizationDtos {
  public static class CreateRegularizationRequest {
    @NotNull private LocalDate date;
    private LocalTime inTime;
    private LocalTime outTime;
    @NotBlank private String reason;

    public LocalDate getDate() { return date; }
    public void setDate(LocalDate date) { this.date = date; }
    public LocalTime getInTime() { return inTime; }
    public void setInTime(LocalTime inTime) { this.inTime = inTime; }
    public LocalTime getOutTime() { return outTime; }
    public void setOutTime(LocalTime outTime) { this.outTime = outTime; }
    public String getReason() { return reason; }
    public void setReason(String reason) { this.reason = reason; }
  }

  public static class DecideRegularizationRequest {
    private String remarks;
    public String getRemarks() { return remarks; }
    public void setRemarks(String remarks) { this.remarks = remarks; }
  }

  public static class RegularizationResponse {
    private final Long id;
    private final Long employeeId;
    private final String employeeName;
    private final String employeeNumber;
    private final LocalDate date;
    private final LocalTime inTime;
    private final LocalTime outTime;
    private final String reason;
    private final String attachmentUrl;
    private final String attachmentName;
    private final RegularizationStatus status;
    private final Instant createdAt;
    private final Instant decidedAt;
    private final String decidedBy;
    private final String hrRemarks;

    public RegularizationResponse(Long id, Long employeeId, String employeeName, String employeeNumber, LocalDate date, LocalTime inTime, LocalTime outTime, String reason, String attachmentUrl, String attachmentName, RegularizationStatus status, Instant createdAt, Instant decidedAt, String decidedBy, String hrRemarks) {
      this.id = id; this.employeeId = employeeId; this.employeeName = employeeName; this.employeeNumber = employeeNumber; this.date = date; this.inTime = inTime; this.outTime = outTime; this.reason = reason; this.attachmentUrl = attachmentUrl; this.attachmentName = attachmentName; this.status = status; this.createdAt = createdAt; this.decidedAt = decidedAt; this.decidedBy = decidedBy; this.hrRemarks = hrRemarks;
    }
    public Long getId() { return id; }
    public Long getEmployeeId() { return employeeId; }
    public String getEmployeeName() { return employeeName; }
    public String getEmployeeNumber() { return employeeNumber; }
    public LocalDate getDate() { return date; }
    public LocalTime getInTime() { return inTime; }
    public LocalTime getOutTime() { return outTime; }
    public String getReason() { return reason; }
    public String getAttachmentUrl() { return attachmentUrl; }
    public String getAttachmentName() { return attachmentName; }
    public RegularizationStatus getStatus() { return status; }
    public Instant getCreatedAt() { return createdAt; }
    public Instant getDecidedAt() { return decidedAt; }
    public String getDecidedBy() { return decidedBy; }
    public String getHrRemarks() { return hrRemarks; }
  }
}
