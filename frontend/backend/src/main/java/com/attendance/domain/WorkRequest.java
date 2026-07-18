package com.attendance.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import java.time.Instant;
import java.time.LocalDate;

@Entity
@Table(name = "work_requests")
public class WorkRequest {
  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  private Long id;

  @ManyToOne(fetch = FetchType.LAZY, optional = false)
  @JoinColumn(name = "employee_id", nullable = false)
  private Employee employee;

  @Enumerated(EnumType.STRING)
  @Column(nullable = false, length = 30)
  private WorkRequestType type;

  @Column(nullable = false)
  private LocalDate fromDate;

  @Column(nullable = false)
  private LocalDate toDate;

  @Column(nullable = false, length = 255)
  private String reason;

  @Enumerated(EnumType.STRING)
  @Column(nullable = false, length = 30)
  private WorkRequestStatus status = WorkRequestStatus.PENDING;

  @Column(nullable = false)
  private Instant createdAt = Instant.now();

  private Instant decidedAt;

  @ManyToOne(fetch = FetchType.LAZY)
  @JoinColumn(name = "decided_by_user_id")
  private AppUser decidedBy;

  @Column(length = 255)
  private String remarks;

  @Column(name = "attachment_url", length = 500)
  private String attachmentUrl;

  @Column(name = "attachment_name", length = 180)
  private String attachmentName;

  public Long getId() { return id; }
  public Employee getEmployee() { return employee; }
  public void setEmployee(Employee employee) { this.employee = employee; }
  public WorkRequestType getType() { return type; }
  public void setType(WorkRequestType type) { this.type = type; }
  public LocalDate getFromDate() { return fromDate; }
  public void setFromDate(LocalDate fromDate) { this.fromDate = fromDate; }
  public LocalDate getToDate() { return toDate; }
  public void setToDate(LocalDate toDate) { this.toDate = toDate; }
  public String getReason() { return reason; }
  public void setReason(String reason) { this.reason = reason; }
  public WorkRequestStatus getStatus() { return status; }
  public void setStatus(WorkRequestStatus status) { this.status = status; }
  public Instant getCreatedAt() { return createdAt; }
  public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }
  public Instant getDecidedAt() { return decidedAt; }
  public void setDecidedAt(Instant decidedAt) { this.decidedAt = decidedAt; }
  public AppUser getDecidedBy() { return decidedBy; }
  public void setDecidedBy(AppUser decidedBy) { this.decidedBy = decidedBy; }
  public String getRemarks() { return remarks; }
  public void setRemarks(String remarks) { this.remarks = remarks; }
  public String getAttachmentUrl() { return attachmentUrl; }
  public void setAttachmentUrl(String attachmentUrl) { this.attachmentUrl = attachmentUrl; }
  public String getAttachmentName() { return attachmentName; }
  public void setAttachmentName(String attachmentName) { this.attachmentName = attachmentName; }
}
