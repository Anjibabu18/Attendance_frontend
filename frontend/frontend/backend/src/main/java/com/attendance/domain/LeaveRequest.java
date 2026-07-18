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
@Table(name = "leave_requests")
public class LeaveRequest {
  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  private Long id;

  @ManyToOne(fetch = FetchType.LAZY, optional = false)
  @JoinColumn(name = "employee_id", nullable = false)
  private Employee employee;

  @Column(name = "from_date", nullable = false)
  private LocalDate fromDate;

  @Column(name = "to_date", nullable = false)
  private LocalDate toDate;

  @Column(nullable = false, length = 255)
  private String reason;

  @Column(name = "leave_type", length = 40)
  private String leaveType;

  @Column(name = "mail_subject", length = 160)
  private String mailSubject;

  @Column(name = "mail_message", length = 2000)
  private String mailMessage;

  @Column(name = "attachment_url", length = 500)
  private String attachmentUrl;

  @Column(name = "attachment_name", length = 180)
  private String attachmentName;

  @Enumerated(EnumType.STRING)
  @Column(nullable = false, length = 20)
  private LeaveRequestStatus status = LeaveRequestStatus.PENDING;

  @Column(name = "created_at", nullable = false)
  private Instant createdAt = Instant.now();

  @Column(name = "decided_at")
  private Instant decidedAt;

  @ManyToOne(fetch = FetchType.LAZY)
  @JoinColumn(name = "decided_by_user_id")
  private AppUser decidedBy;

  @Column(name = "hr_remarks", length = 255)
  private String hrRemarks;

  public Long getId() {
    return id;
  }

  public void setId(Long id) {
    this.id = id;
  }

  public Employee getEmployee() {
    return employee;
  }

  public void setEmployee(Employee employee) {
    this.employee = employee;
  }

  public LocalDate getFromDate() {
    return fromDate;
  }

  public void setFromDate(LocalDate fromDate) {
    this.fromDate = fromDate;
  }

  public LocalDate getToDate() {
    return toDate;
  }

  public void setToDate(LocalDate toDate) {
    this.toDate = toDate;
  }

  public String getReason() {
    return reason;
  }

  public void setReason(String reason) {
    this.reason = reason;
  }

  public String getLeaveType() {
    return leaveType;
  }

  public void setLeaveType(String leaveType) {
    this.leaveType = leaveType;
  }

  public String getMailSubject() {
    return mailSubject;
  }

  public void setMailSubject(String mailSubject) {
    this.mailSubject = mailSubject;
  }

  public String getMailMessage() {
    return mailMessage;
  }

  public void setMailMessage(String mailMessage) {
    this.mailMessage = mailMessage;
  }

  public String getAttachmentUrl() {
    return attachmentUrl;
  }

  public void setAttachmentUrl(String attachmentUrl) {
    this.attachmentUrl = attachmentUrl;
  }

  public String getAttachmentName() {
    return attachmentName;
  }

  public void setAttachmentName(String attachmentName) {
    this.attachmentName = attachmentName;
  }

  public LeaveRequestStatus getStatus() {
    return status;
  }

  public void setStatus(LeaveRequestStatus status) {
    this.status = status;
  }

  public Instant getCreatedAt() {
    return createdAt;
  }

  public void setCreatedAt(Instant createdAt) {
    this.createdAt = createdAt;
  }

  public Instant getDecidedAt() {
    return decidedAt;
  }

  public void setDecidedAt(Instant decidedAt) {
    this.decidedAt = decidedAt;
  }

  public AppUser getDecidedBy() {
    return decidedBy;
  }

  public void setDecidedBy(AppUser decidedBy) {
    this.decidedBy = decidedBy;
  }

  public String getHrRemarks() {
    return hrRemarks;
  }

  public void setHrRemarks(String hrRemarks) {
    this.hrRemarks = hrRemarks;
  }
}
