package com.attendance.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.time.LocalTime;

@Entity
@Table(name = "attendance_settings")
public class AttendanceSettings {
  @Id
  private Long id = 1L;

  @Column(name = "default_in_time")
  private LocalTime defaultInTime;

  @Column(name = "default_out_time")
  private LocalTime defaultOutTime;

  @Column(name = "weekend_days", length = 50)
  private String weekendDays;

  @Column(name = "full_day_minutes")
  private Integer fullDayMinutes;

  @Column(name = "half_day_minutes")
  private Integer halfDayMinutes;

  @Column(name = "late_grace_minutes")
  private Integer lateGraceMinutes;

  @Column(name = "early_leave_grace_minutes")
  private Integer earlyLeaveGraceMinutes;

  @Column(name = "overtime_after_minutes")
  private Integer overtimeAfterMinutes;

  @Column(name = "late_deduction_per_minute")
  private Double lateDeductionPerMinute;

  @Column(name = "overtime_pay_per_hour")
  private Double overtimePayPerHour;

  @Column(name = "unpaid_leave_daily_rate")
  private Double unpaidLeaveDailyRate;

  @Column(name = "standard_monthly_salary")
  private Double standardMonthlySalary;

  @Column(name = "require_qr_for_punch")
  private Boolean requireQrForPunch;

  @Column(name = "permanent_office_qr")
  private Boolean permanentOfficeQr;

  @Column(name = "qr_token_validity_minutes")
  private Integer qrTokenValidityMinutes;

  @Column(name = "office_ip_restriction_enabled")
  private Boolean officeIpRestrictionEnabled;

  @Column(name = "allowed_office_cidrs", length = 1000)
  private String allowedOfficeCidrs;

  @Column(name = "trust_proxy_headers")
  private Boolean trustProxyHeaders;

  public Long getId() {
    return id;
  }

  public void setId(Long id) {
    this.id = id;
  }

  public LocalTime getDefaultInTime() {
    return defaultInTime;
  }

  public void setDefaultInTime(LocalTime defaultInTime) {
    this.defaultInTime = defaultInTime;
  }

  public LocalTime getDefaultOutTime() {
    return defaultOutTime;
  }

  public void setDefaultOutTime(LocalTime defaultOutTime) {
    this.defaultOutTime = defaultOutTime;
  }

  public String getWeekendDays() {
    return weekendDays;
  }

  public void setWeekendDays(String weekendDays) {
    this.weekendDays = weekendDays;
  }

  public Integer getFullDayMinutes() {
    return fullDayMinutes;
  }

  public void setFullDayMinutes(Integer fullDayMinutes) {
    this.fullDayMinutes = fullDayMinutes;
  }

  public Integer getHalfDayMinutes() {
    return halfDayMinutes;
  }

  public void setHalfDayMinutes(Integer halfDayMinutes) {
    this.halfDayMinutes = halfDayMinutes;
  }

  public Integer getLateGraceMinutes() {
    return lateGraceMinutes;
  }

  public void setLateGraceMinutes(Integer lateGraceMinutes) {
    this.lateGraceMinutes = lateGraceMinutes;
  }

  public Integer getEarlyLeaveGraceMinutes() {
    return earlyLeaveGraceMinutes;
  }

  public void setEarlyLeaveGraceMinutes(Integer earlyLeaveGraceMinutes) {
    this.earlyLeaveGraceMinutes = earlyLeaveGraceMinutes;
  }

  public Integer getOvertimeAfterMinutes() {
    return overtimeAfterMinutes;
  }

  public void setOvertimeAfterMinutes(Integer overtimeAfterMinutes) {
    this.overtimeAfterMinutes = overtimeAfterMinutes;
  }

  public Double getLateDeductionPerMinute() {
    return lateDeductionPerMinute;
  }

  public void setLateDeductionPerMinute(Double lateDeductionPerMinute) {
    this.lateDeductionPerMinute = lateDeductionPerMinute;
  }

  public Double getOvertimePayPerHour() {
    return overtimePayPerHour;
  }

  public void setOvertimePayPerHour(Double overtimePayPerHour) {
    this.overtimePayPerHour = overtimePayPerHour;
  }

  public Double getUnpaidLeaveDailyRate() {
    return unpaidLeaveDailyRate;
  }

  public void setUnpaidLeaveDailyRate(Double unpaidLeaveDailyRate) {
    this.unpaidLeaveDailyRate = unpaidLeaveDailyRate;
  }

  public Double getStandardMonthlySalary() {
    return standardMonthlySalary;
  }

  public void setStandardMonthlySalary(Double standardMonthlySalary) {
    this.standardMonthlySalary = standardMonthlySalary;
  }

  public Boolean getRequireQrForPunch() {
    return requireQrForPunch;
  }

  public void setRequireQrForPunch(Boolean requireQrForPunch) {
    this.requireQrForPunch = requireQrForPunch;
  }

  public Boolean getPermanentOfficeQr() {
    return permanentOfficeQr;
  }

  public void setPermanentOfficeQr(Boolean permanentOfficeQr) {
    this.permanentOfficeQr = permanentOfficeQr;
  }

  public Integer getQrTokenValidityMinutes() {
    return qrTokenValidityMinutes;
  }

  public void setQrTokenValidityMinutes(Integer qrTokenValidityMinutes) {
    this.qrTokenValidityMinutes = qrTokenValidityMinutes;
  }

  public Boolean getOfficeIpRestrictionEnabled() {
    return officeIpRestrictionEnabled;
  }

  public void setOfficeIpRestrictionEnabled(Boolean officeIpRestrictionEnabled) {
    this.officeIpRestrictionEnabled = officeIpRestrictionEnabled;
  }

  public String getAllowedOfficeCidrs() {
    return allowedOfficeCidrs;
  }

  public void setAllowedOfficeCidrs(String allowedOfficeCidrs) {
    this.allowedOfficeCidrs = allowedOfficeCidrs;
  }

  public Boolean getTrustProxyHeaders() {
    return trustProxyHeaders;
  }

  public void setTrustProxyHeaders(Boolean trustProxyHeaders) {
    this.trustProxyHeaders = trustProxyHeaders;
  }
}
