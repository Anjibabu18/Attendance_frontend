package com.attendance.service;

import com.attendance.config.AppConfig;
import com.attendance.domain.AttendanceSettings;
import com.attendance.repo.AttendanceSettingsRepository;
import java.time.LocalTime;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class AttendanceSettingsService {
  private static final long SINGLETON_ID = 1L;

  private final AttendanceSettingsRepository attendanceSettingsRepository;
  private final AppConfig appConfig;

  public AttendanceSettingsService(
      AttendanceSettingsRepository attendanceSettingsRepository, AppConfig appConfig) {
    this.attendanceSettingsRepository = attendanceSettingsRepository;
    this.appConfig = appConfig;
  }

  @Transactional
  public AttendanceSettings get() {
    AttendanceSettings s =
        attendanceSettingsRepository.findById(SINGLETON_ID).orElseGet(this::createDefault);
    ensureDefaults(s);
    return s;
  }

  @Transactional
  public AttendanceSettings update(LocalTime defaultInTime, LocalTime defaultOutTime) {
    AttendanceSettings s =
        attendanceSettingsRepository.findById(SINGLETON_ID).orElseGet(AttendanceSettings::new);
    s.setId(SINGLETON_ID);
    s.setDefaultInTime(defaultInTime);
    s.setDefaultOutTime(defaultOutTime);
    ensureDefaults(s);
    return attendanceSettingsRepository.save(s);
  }

  @Transactional
  public AttendanceSettings update(LocalTime defaultInTime, LocalTime defaultOutTime, String weekendDays) {
    AttendanceSettings s =
        attendanceSettingsRepository.findById(SINGLETON_ID).orElseGet(AttendanceSettings::new);
    s.setId(SINGLETON_ID);
    s.setDefaultInTime(defaultInTime);
    s.setDefaultOutTime(defaultOutTime);
    s.setWeekendDays(weekendDays);
    ensureDefaults(s);
    return attendanceSettingsRepository.save(s);
  }

  @Transactional
  public AttendanceSettings update(
      LocalTime defaultInTime,
      LocalTime defaultOutTime,
      String weekendDays,
      Integer fullDayMinutes,
      Integer halfDayMinutes) {
    return update(defaultInTime, defaultOutTime, weekendDays, fullDayMinutes, halfDayMinutes, 10, 10, fullDayMinutes);
  }

  @Transactional
  public AttendanceSettings update(
      LocalTime defaultInTime,
      LocalTime defaultOutTime,
      String weekendDays,
      Integer fullDayMinutes,
      Integer halfDayMinutes,
      Integer lateGraceMinutes,
      Integer earlyLeaveGraceMinutes,
      Integer overtimeAfterMinutes) {
    return update(
        defaultInTime,
        defaultOutTime,
        weekendDays,
        fullDayMinutes,
        halfDayMinutes,
        lateGraceMinutes,
        earlyLeaveGraceMinutes,
        overtimeAfterMinutes,
        1d,
        0d,
        500d,
        25000d,
        false,
        false,
        10080);
  }

  @Transactional
  public AttendanceSettings update(
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
    if (fullDayMinutes == null || fullDayMinutes <= 0) {
      throw new ApiException(HttpStatus.BAD_REQUEST, "fullDayMinutes must be > 0");
    }
    if (halfDayMinutes == null || halfDayMinutes <= 0) {
      throw new ApiException(HttpStatus.BAD_REQUEST, "halfDayMinutes must be > 0");
    }
    if (halfDayMinutes > fullDayMinutes) {
      throw new ApiException(HttpStatus.BAD_REQUEST, "halfDayMinutes must be <= fullDayMinutes");
    }
    if (lateGraceMinutes == null || lateGraceMinutes < 0) {
      throw new ApiException(HttpStatus.BAD_REQUEST, "lateGraceMinutes must be >= 0");
    }
    if (earlyLeaveGraceMinutes == null || earlyLeaveGraceMinutes < 0) {
      throw new ApiException(HttpStatus.BAD_REQUEST, "earlyLeaveGraceMinutes must be >= 0");
    }
    if (overtimeAfterMinutes == null || overtimeAfterMinutes <= 0) {
      throw new ApiException(HttpStatus.BAD_REQUEST, "overtimeAfterMinutes must be > 0");
    }
    if (qrTokenValidityMinutes == null || qrTokenValidityMinutes <= 0) {
      throw new ApiException(HttpStatus.BAD_REQUEST, "qrTokenValidityMinutes must be > 0");
    }

    AttendanceSettings s =
        attendanceSettingsRepository.findById(SINGLETON_ID).orElseGet(AttendanceSettings::new);
    s.setId(SINGLETON_ID);
    s.setDefaultInTime(defaultInTime);
    s.setDefaultOutTime(defaultOutTime);
    s.setWeekendDays(weekendDays);
    s.setFullDayMinutes(fullDayMinutes);
    s.setHalfDayMinutes(halfDayMinutes);
    s.setLateGraceMinutes(lateGraceMinutes);
    s.setEarlyLeaveGraceMinutes(earlyLeaveGraceMinutes);
    s.setOvertimeAfterMinutes(overtimeAfterMinutes);
    s.setLateDeductionPerMinute(lateDeductionPerMinute);
    s.setOvertimePayPerHour(overtimePayPerHour);
    s.setUnpaidLeaveDailyRate(unpaidLeaveDailyRate);
    s.setStandardMonthlySalary(standardMonthlySalary);
    s.setRequireQrForPunch(requireQrForPunch);
    s.setPermanentOfficeQr(permanentOfficeQr);
    s.setQrTokenValidityMinutes(qrTokenValidityMinutes);
    ensureDefaults(s);
    return attendanceSettingsRepository.save(s);
  }

  @Transactional
  protected AttendanceSettings createDefault() {
    AttendanceSettings s = new AttendanceSettings();
    s.setId(SINGLETON_ID);
    s.setDefaultInTime(LocalTime.of(9, 0));
    s.setDefaultOutTime(LocalTime.of(18, 0));
    s.setWeekendDays("SUNDAY");
    s.setFullDayMinutes(appConfig.getAttendance().getMinDailyMinutes());
    s.setHalfDayMinutes(Math.max(1, appConfig.getAttendance().getMinDailyMinutes() / 2));
    s.setLateGraceMinutes(10);
    s.setEarlyLeaveGraceMinutes(10);
    s.setOvertimeAfterMinutes(appConfig.getAttendance().getMinDailyMinutes());
    s.setLateDeductionPerMinute(1d);
    s.setOvertimePayPerHour(0d);
    s.setUnpaidLeaveDailyRate(500d);
    s.setStandardMonthlySalary(25000d);
    s.setRequireQrForPunch(false);
    s.setPermanentOfficeQr(false);
    s.setQrTokenValidityMinutes(10080);
    return attendanceSettingsRepository.save(s);
  }

  private void ensureDefaults(AttendanceSettings s) {
    if (s.getFullDayMinutes() == null || s.getFullDayMinutes() <= 0) {
      s.setFullDayMinutes(appConfig.getAttendance().getMinDailyMinutes());
    }
    if (s.getHalfDayMinutes() == null || s.getHalfDayMinutes() <= 0) {
      s.setHalfDayMinutes(Math.max(1, s.getFullDayMinutes() / 2));
    }
    if (s.getHalfDayMinutes() > s.getFullDayMinutes()) {
      s.setHalfDayMinutes(Math.max(1, s.getFullDayMinutes() / 2));
    }
    if (s.getLateGraceMinutes() == null || s.getLateGraceMinutes() < 0) {
      s.setLateGraceMinutes(10);
    }
    if (s.getEarlyLeaveGraceMinutes() == null || s.getEarlyLeaveGraceMinutes() < 0) {
      s.setEarlyLeaveGraceMinutes(10);
    }
    if (s.getOvertimeAfterMinutes() == null || s.getOvertimeAfterMinutes() <= 0) {
      s.setOvertimeAfterMinutes(s.getFullDayMinutes());
    }
    if (s.getLateDeductionPerMinute() == null || s.getLateDeductionPerMinute() < 0) {
      s.setLateDeductionPerMinute(1d);
    }
    if (s.getOvertimePayPerHour() == null || s.getOvertimePayPerHour() < 0) {
      s.setOvertimePayPerHour(0d);
    }
    if (s.getUnpaidLeaveDailyRate() == null || s.getUnpaidLeaveDailyRate() < 0) {
      s.setUnpaidLeaveDailyRate(500d);
    }
    if (s.getStandardMonthlySalary() == null || s.getStandardMonthlySalary() < 0) {
      s.setStandardMonthlySalary(25000d);
    }
    if (s.getRequireQrForPunch() == null) {
      s.setRequireQrForPunch(false);
    }
    if (s.getPermanentOfficeQr() == null) {
      s.setPermanentOfficeQr(false);
    }
    if (s.getQrTokenValidityMinutes() == null || s.getQrTokenValidityMinutes() <= 0) {
      s.setQrTokenValidityMinutes(10080);
    }
  }
}
