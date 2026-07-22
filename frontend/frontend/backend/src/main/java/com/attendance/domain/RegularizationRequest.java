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
import java.time.LocalTime;

@Entity
@Table(name = "regularization_requests")
public class RegularizationRequest {
  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  private Long id;

  @ManyToOne(fetch = FetchType.LAZY, optional = false)
  @JoinColumn(name = "employee_id", nullable = false)
  private Employee employee;

  @Column(nullable = false)
  private LocalDate date;

  @Column(name = "requested_in_time")
  private LocalTime requestedInTime;

  @Column(name = "requested_out_time")
  private LocalTime requestedOutTime;

  @Column(nullable = false, length = 255)
  private String reason;

  @Enumerated(EnumType.STRING)
  @Column(nullable = false, length = 20)
  private RegularizationStatus status = RegularizationStatus.PENDING;

  @Column(nullable = false)
  private Instant createdAt = Instant.now();

  @Column
  private Instant decidedAt;

  @ManyToOne(fetch = FetchType.LAZY)
  @JoinColumn(name = "decided_by_user_id")
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
  public LocalDate getDate() { return date; }
  public void setDate(LocalDate date) { this.date = date; }
  public LocalTime getRequestedInTime() { return requestedInTime; }
  public void setRequestedInTime(LocalTime requestedInTime) { this.requestedInTime = requestedInTime; }
  public LocalTime getRequestedOutTime() { return requestedOutTime; }
  public void setRequestedOutTime(LocalTime requestedOutTime) { this.requestedOutTime = requestedOutTime; }
  public String getReason() { return reason; }
  public void setReason(String reason) { this.reason = reason; }
  public RegularizationStatus getStatus() { return status; }
  public void setStatus(RegularizationStatus status) { this.status = status; }
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
