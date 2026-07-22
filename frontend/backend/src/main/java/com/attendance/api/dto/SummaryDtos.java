package com.attendance.api.dto;

import java.time.LocalDate;

public class SummaryDtos {
  public static class MonthSummaryResponse {
    private String month; // YYYY-MM
    private LocalDate fromDate;
    private LocalDate toDate;
    private int workingDays;
    private int presentDays;
    private int halfDayDays;
    private int leaveDays;
    private int totalWorkedMinutes;

    public MonthSummaryResponse(
        String month,
        LocalDate fromDate,
        LocalDate toDate,
        int workingDays,
        int presentDays,
        int halfDayDays,
        int leaveDays,
        int totalWorkedMinutes) {
      this.month = month;
      this.fromDate = fromDate;
      this.toDate = toDate;
      this.workingDays = workingDays;
      this.presentDays = presentDays;
      this.halfDayDays = halfDayDays;
      this.leaveDays = leaveDays;
      this.totalWorkedMinutes = totalWorkedMinutes;
    }

    public String getMonth() {
      return month;
    }

    public LocalDate getFromDate() {
      return fromDate;
    }

    public LocalDate getToDate() {
      return toDate;
    }

    public int getWorkingDays() {
      return workingDays;
    }

    public int getPresentDays() {
      return presentDays;
    }

    public int getHalfDayDays() {
      return halfDayDays;
    }

    public int getLeaveDays() {
      return leaveDays;
    }

    public int getTotalWorkedMinutes() {
      return totalWorkedMinutes;
    }
  }
}
