package com.attendance.domain;

import jakarta.persistence.*;
import java.time.Instant;
import java.time.LocalDate;

@Entity
@Table(name = "comp_off_requests")
public class CompOffRequest {
  @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
  private Long id;
  @ManyToOne(fetch = FetchType.LAZY, optional = false) @JoinColumn(name = "employee_id", nullable = false)
  private Employee employee;
  @Column(nullable = false)
  private LocalDate overtimeDate;
  @Column(nullable = false)
  private LocalDate requestedDate;
  @Column(nullable = false)
  private Integer overtimeMinutes;
  @Column(nullable = false, length = 255)
  private String reason;
  @Enumerated(EnumType.STRING) @Column(nullable = false, length = 20)
  private CompOffRequestStatus status = CompOffRequestStatus.PENDING;
  @Column(nullable = false)
  private Instant createdAt = Instant.now();
  private Instant decidedAt;
  @ManyToOne(fetch = FetchType.LAZY) @JoinColumn(name = "decided_by_user_id")
  private AppUser decidedBy;
  @Column(length = 255)
  private String hrRemarks;
  @Column(name = "attachment_url", length = 500)
  private String attachmentUrl;
  @Column(name = "attachment_name", length = 180)
  private String attachmentName;
  public Long getId() { return id; }
  public Employee getEmployee() { return employee; }
  public void setEmployee(Employee employee) { this.employee = employee; }
  public LocalDate getOvertimeDate() { return overtimeDate; }
  public void setOvertimeDate(LocalDate overtimeDate) { this.overtimeDate = overtimeDate; }
  public LocalDate getRequestedDate() { return requestedDate; }
  public void setRequestedDate(LocalDate requestedDate) { this.requestedDate = requestedDate; }
  public Integer getOvertimeMinutes() { return overtimeMinutes; }
  public void setOvertimeMinutes(Integer overtimeMinutes) { this.overtimeMinutes = overtimeMinutes; }
  public String getReason() { return reason; }
  public void setReason(String reason) { this.reason = reason; }
  public CompOffRequestStatus getStatus() { return status; }
  public void setStatus(CompOffRequestStatus status) { this.status = status; }
  public Instant getCreatedAt() { return createdAt; }
  public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }
  public Instant getDecidedAt() { return decidedAt; }
  public void setDecidedAt(Instant decidedAt) { this.decidedAt = decidedAt; }
  public AppUser getDecidedBy() { return decidedBy; }
  public void setDecidedBy(AppUser decidedBy) { this.decidedBy = decidedBy; }
  public String getHrRemarks() { return hrRemarks; }
  public void setHrRemarks(String hrRemarks) { this.hrRemarks = hrRemarks; }
  public String getAttachmentUrl() { return attachmentUrl; }
  public void setAttachmentUrl(String attachmentUrl) { this.attachmentUrl = attachmentUrl; }
  public String getAttachmentName() { return attachmentName; }
  public void setAttachmentName(String attachmentName) { this.attachmentName = attachmentName; }
}
