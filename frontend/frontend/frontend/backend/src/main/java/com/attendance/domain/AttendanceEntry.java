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
import jakarta.persistence.UniqueConstraint;
import java.time.LocalDate;
import java.time.LocalTime;

@Entity
@Table(
    name = "attendance_entries",
    uniqueConstraints = {
      @UniqueConstraint(
          name = "uk_attendance_emp_date",
          columnNames = {"employee_id", "entry_date"})
    })
public class AttendanceEntry {
  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  private Long id;

  @ManyToOne(fetch = FetchType.LAZY, optional = false)
  @JoinColumn(name = "employee_id", nullable = false)
  private Employee employee;

  @Column(name = "entry_date", nullable = false)
  private LocalDate date;

  @Column(name = "in_time")
  private LocalTime inTime;

  @Column(name = "out_time")
  private LocalTime outTime;

  @Column(name = "worked_minutes")
  private Integer workedMinutes;

  @Column(name = "late_minutes")
  private Integer lateMinutes;

  @Column(name = "early_leave_minutes")
  private Integer earlyLeaveMinutes;

  @Column(name = "overtime_minutes")
  private Integer overtimeMinutes;

  @Column(name = "leave_reason", length = 255)
  private String leaveReason;

  @Column(name = "check_in_latitude")
  private Double checkInLatitude;

  @Column(name = "check_in_longitude")
  private Double checkInLongitude;

  @Column(name = "check_in_photo_url", length = 500)
  private String checkInPhotoUrl;

  @Column(name = "check_in_face_score")
  private Double checkInFaceScore;

  @Column(name = "check_in_face_verified")
  private Boolean checkInFaceVerified;

  @Column(name = "check_out_latitude")
  private Double checkOutLatitude;

  @Column(name = "check_out_longitude")
  private Double checkOutLongitude;

  @Column(name = "check_out_photo_url", length = 500)
  private String checkOutPhotoUrl;

  @Column(name = "check_out_face_score")
  private Double checkOutFaceScore;

  @Column(name = "check_out_face_verified")
  private Boolean checkOutFaceVerified;

  @Enumerated(EnumType.STRING)
  @Column(nullable = false, length = 10)
  private AttendanceStatus status;

  @Column(name = "timezone_corrected", nullable = false, columnDefinition = "boolean default false")
  private boolean timezoneCorrected = false;

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

  public LocalDate getDate() {
    return date;
  }

  public void setDate(LocalDate date) {
    this.date = date;
  }

  public LocalTime getInTime() {
    return inTime;
  }

  public void setInTime(LocalTime inTime) {
    this.inTime = inTime;
  }

  public LocalTime getOutTime() {
    return outTime;
  }

  public void setOutTime(LocalTime outTime) {
    this.outTime = outTime;
  }

  public Integer getWorkedMinutes() {
    return workedMinutes;
  }

  public void setWorkedMinutes(Integer workedMinutes) {
    this.workedMinutes = workedMinutes;
  }

  public Integer getLateMinutes() {
    return lateMinutes;
  }

  public void setLateMinutes(Integer lateMinutes) {
    this.lateMinutes = lateMinutes;
  }

  public Integer getEarlyLeaveMinutes() {
    return earlyLeaveMinutes;
  }

  public void setEarlyLeaveMinutes(Integer earlyLeaveMinutes) {
    this.earlyLeaveMinutes = earlyLeaveMinutes;
  }

  public Integer getOvertimeMinutes() {
    return overtimeMinutes;
  }

  public void setOvertimeMinutes(Integer overtimeMinutes) {
    this.overtimeMinutes = overtimeMinutes;
  }

  public String getLeaveReason() {
    return leaveReason;
  }

  public void setLeaveReason(String leaveReason) {
    this.leaveReason = leaveReason;
  }

  public Double getCheckInLatitude() {
    return checkInLatitude;
  }

  public void setCheckInLatitude(Double checkInLatitude) {
    this.checkInLatitude = checkInLatitude;
  }

  public Double getCheckInLongitude() {
    return checkInLongitude;
  }

  public void setCheckInLongitude(Double checkInLongitude) {
    this.checkInLongitude = checkInLongitude;
  }

  public String getCheckInPhotoUrl() {
    return checkInPhotoUrl;
  }

  public void setCheckInPhotoUrl(String checkInPhotoUrl) {
    this.checkInPhotoUrl = checkInPhotoUrl;
  }

  public Double getCheckInFaceScore() {
    return checkInFaceScore;
  }

  public void setCheckInFaceScore(Double checkInFaceScore) {
    this.checkInFaceScore = checkInFaceScore;
  }

  public Boolean getCheckInFaceVerified() {
    return checkInFaceVerified;
  }

  public void setCheckInFaceVerified(Boolean checkInFaceVerified) {
    this.checkInFaceVerified = checkInFaceVerified;
  }

  public Double getCheckOutLatitude() {
    return checkOutLatitude;
  }

  public void setCheckOutLatitude(Double checkOutLatitude) {
    this.checkOutLatitude = checkOutLatitude;
  }

  public Double getCheckOutLongitude() {
    return checkOutLongitude;
  }

  public void setCheckOutLongitude(Double checkOutLongitude) {
    this.checkOutLongitude = checkOutLongitude;
  }

  public String getCheckOutPhotoUrl() {
    return checkOutPhotoUrl;
  }

  public void setCheckOutPhotoUrl(String checkOutPhotoUrl) {
    this.checkOutPhotoUrl = checkOutPhotoUrl;
  }

  public Double getCheckOutFaceScore() {
    return checkOutFaceScore;
  }

  public void setCheckOutFaceScore(Double checkOutFaceScore) {
    this.checkOutFaceScore = checkOutFaceScore;
  }

  public Boolean getCheckOutFaceVerified() {
    return checkOutFaceVerified;
  }

  public void setCheckOutFaceVerified(Boolean checkOutFaceVerified) {
    this.checkOutFaceVerified = checkOutFaceVerified;
  }

  public AttendanceStatus getStatus() {
    return status;
  }

  public void setStatus(AttendanceStatus status) {
    this.status = status;
  }

  public boolean isTimezoneCorrected() {
    return timezoneCorrected;
  }

  public void setTimezoneCorrected(boolean timezoneCorrected) {
    this.timezoneCorrected = timezoneCorrected;
  }
}
