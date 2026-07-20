package com.attendance.api;

import com.attendance.api.dto.SettingsDtos;
import com.attendance.service.AttendanceSettingsService;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/settings")
@PreAuthorize("isAuthenticated()")
public class SettingsController {
  private final AttendanceSettingsService attendanceSettingsService;

  public SettingsController(AttendanceSettingsService attendanceSettingsService) {
    this.attendanceSettingsService = attendanceSettingsService;
  }

  @GetMapping("/attendance")
  public SettingsDtos.AttendanceSettingsResponse attendance() {
    var s = attendanceSettingsService.get();
    return new SettingsDtos.AttendanceSettingsResponse(
        s.getDefaultInTime(),
        s.getDefaultOutTime(),
        s.getWeekendDays(),
        s.getFullDayMinutes(),
        s.getHalfDayMinutes(),
        s.getLateGraceMinutes(),
        s.getEarlyLeaveGraceMinutes(),
        s.getOvertimeAfterMinutes(),
        s.getLateDeductionPerMinute(),
        s.getOvertimePayPerHour(),
        s.getUnpaidLeaveDailyRate(),
        s.getStandardMonthlySalary(),
        s.getRequireQrForPunch(),
        s.getPermanentOfficeQr(),
        s.getQrTokenValidityMinutes());
  }
}
