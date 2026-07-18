package com.attendance.api.dto;

import jakarta.validation.constraints.NotNull;
import java.time.LocalDate;

public class RosterDtos {
  public static class AssignShiftRequest {
    @NotNull private Long employeeId;
    @NotNull private Long shiftId;
    @NotNull private LocalDate fromDate;
    @NotNull private LocalDate toDate;
    public Long getEmployeeId() { return employeeId; }
    public void setEmployeeId(Long employeeId) { this.employeeId = employeeId; }
    public Long getShiftId() { return shiftId; }
    public void setShiftId(Long shiftId) { this.shiftId = shiftId; }
    public LocalDate getFromDate() { return fromDate; }
    public void setFromDate(LocalDate fromDate) { this.fromDate = fromDate; }
    public LocalDate getToDate() { return toDate; }
    public void setToDate(LocalDate toDate) { this.toDate = toDate; }
  }
}
