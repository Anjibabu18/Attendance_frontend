package com.attendance.service;

import java.time.LocalDate;
import java.time.LocalTime;
import java.time.ZoneId;
import java.time.temporal.ChronoUnit;

public final class AttendanceClock {
  public static final ZoneId ZONE = ZoneId.of("Asia/Kolkata");

  private AttendanceClock() {}

  public static LocalDate today() {
    return LocalDate.now(ZONE);
  }

  public static LocalTime now() {
    return LocalTime.now(ZONE);
  }

  public static LocalTime nowMinute() {
    return now().truncatedTo(ChronoUnit.MINUTES);
  }
}
