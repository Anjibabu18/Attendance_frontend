package com.attendance.api.dto;

import jakarta.validation.constraints.NotNull;
import java.time.LocalTime;

public class SettingsDtos {
  public static class AttendanceSettingsResponse {
    private LocalTime defaultInTime;
    private LocalTime defaultOutTime;
    private String weekendDays;
    private Integer fullDayMinutes;
    private Integer halfDayMinutes;
    private Integer lateGraceMinutes;
    private Integer earlyLeaveGraceMinutes;
    private Integer overtimeAfterMinutes;
    private Double lateDeductionPerMinute;
    private Double overtimePayPerHour;
    private Double unpaidLeaveDailyRate;
    private Double standardMonthlySalary;
    private Boolean requireQrForPunch;
    private Boolean permanentOfficeQr;
    private Integer qrTokenValidityMinutes;
    public AttendanceSettingsResponse(
        LocalTime defaultInTime,
        LocalTime defaultOutTime,
        String weekendDays,
        Integer fullDayMinutes,
        Integer halfDayMinutes,
        Integer lateGraceMinutes,
        Integer earlyLeaveGraceMinutes,
        Integer overtimeAfterMinutes,
        Double lateDeductionPerMinute,
        Double overtimePayPerHour,
        Double unpaidLeaveDailyRate,
        Double standardMonthlySalary,
        Boolean requireQrForPunch,
        Boolean permanentOfficeQr,
        Integer qrTokenValidityMinutes) {
      this.defaultInTime = defaultInTime;
      this.defaultOutTime = defaultOutTime;
      this.weekendDays = weekendDays;
      this.fullDayMinutes = fullDayMinutes;
      this.halfDayMinutes = halfDayMinutes;
      this.lateGraceMinutes = lateGraceMinutes;
      this.earlyLeaveGraceMinutes = earlyLeaveGraceMinutes;
      this.overtimeAfterMinutes = overtimeAfterMinutes;
      this.lateDeductionPerMinute = lateDeductionPerMinute;
      this.overtimePayPerHour = overtimePayPerHour;
      this.unpaidLeaveDailyRate = unpaidLeaveDailyRate;
      this.standardMonthlySalary = standardMonthlySalary;
      this.requireQrForPunch = requireQrForPunch;
      this.permanentOfficeQr = permanentOfficeQr;
      this.qrTokenValidityMinutes = qrTokenValidityMinutes;
    }

    public LocalTime getDefaultInTime() {
      return defaultInTime;
    }

    public LocalTime getDefaultOutTime() {
      return defaultOutTime;
    }

    public String getWeekendDays() {
      return weekendDays;
    }

    public Integer getFullDayMinutes() {
      return fullDayMinutes;
    }

    public Integer getHalfDayMinutes() {
      return halfDayMinutes;
    }

    public Integer getLateGraceMinutes() {
      return lateGraceMinutes;
    }

    public Integer getEarlyLeaveGraceMinutes() {
      return earlyLeaveGraceMinutes;
    }

    public Integer getOvertimeAfterMinutes() {
      return overtimeAfterMinutes;
    }
    public Double getLateDeductionPerMinute() { return lateDeductionPerMinute; }
    public Double getOvertimePayPerHour() { return overtimePayPerHour; }
    public Double getUnpaidLeaveDailyRate() { return unpaidLeaveDailyRate; }
    public Double getStandardMonthlySalary() { return standardMonthlySalary; }
    public Boolean getRequireQrForPunch() { return requireQrForPunch; }
    public Boolean getPermanentOfficeQr() { return permanentOfficeQr; }
    public Integer getQrTokenValidityMinutes() { return qrTokenValidityMinutes; }

  }

  public static class UpdateAttendanceSettingsRequest {
    @NotNull private LocalTime defaultInTime;
    @NotNull private LocalTime defaultOutTime;
    @NotNull private String weekendDays;
    @NotNull private Integer fullDayMinutes;
    @NotNull private Integer halfDayMinutes;
    @NotNull private Integer lateGraceMinutes;
    @NotNull private Integer earlyLeaveGraceMinutes;
    @NotNull private Integer overtimeAfterMinutes;
    @NotNull private Double lateDeductionPerMinute;
    @NotNull private Double overtimePayPerHour;
    @NotNull private Double unpaidLeaveDailyRate;
    @NotNull private Double standardMonthlySalary;
    @NotNull private Boolean requireQrForPunch;
    @NotNull private Boolean permanentOfficeQr;
    @NotNull private Integer qrTokenValidityMinutes;


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
    public Double getLateDeductionPerMinute() { return lateDeductionPerMinute; }
    public void setLateDeductionPerMinute(Double lateDeductionPerMinute) { this.lateDeductionPerMinute = lateDeductionPerMinute; }
    public Double getOvertimePayPerHour() { return overtimePayPerHour; }
    public void setOvertimePayPerHour(Double overtimePayPerHour) { this.overtimePayPerHour = overtimePayPerHour; }
    public Double getUnpaidLeaveDailyRate() { return unpaidLeaveDailyRate; }
    public void setUnpaidLeaveDailyRate(Double unpaidLeaveDailyRate) { this.unpaidLeaveDailyRate = unpaidLeaveDailyRate; }
    public Double getStandardMonthlySalary() { return standardMonthlySalary; }
    public void setStandardMonthlySalary(Double standardMonthlySalary) { this.standardMonthlySalary = standardMonthlySalary; }
    public Boolean getRequireQrForPunch() { return requireQrForPunch; }
    public void setRequireQrForPunch(Boolean requireQrForPunch) { this.requireQrForPunch = requireQrForPunch; }
    public Boolean getPermanentOfficeQr() { return permanentOfficeQr; }
    public void setPermanentOfficeQr(Boolean permanentOfficeQr) { this.permanentOfficeQr = permanentOfficeQr; }
    public Integer getQrTokenValidityMinutes() { return qrTokenValidityMinutes; }
    public void setQrTokenValidityMinutes(Integer qrTokenValidityMinutes) { this.qrTokenValidityMinutes = qrTokenValidityMinutes; }

  }
}
