package com.attendance.api.dto;

import java.time.LocalDate;

public class ProductionDtos {
  public static class DeviceRequest {
    private String deviceId;
    private String label;
    public String getDeviceId() { return deviceId; }
    public void setDeviceId(String deviceId) { this.deviceId = deviceId; }
    public String getLabel() { return label; }
    public void setLabel(String label) { this.label = label; }
  }
  public static class DeviceApprovalRequest {
    private boolean approved;
    public boolean isApproved() { return approved; }
    public void setApproved(boolean approved) { this.approved = approved; }
  }
  public static class QrRequest {
    private Long officeId;
    private Integer minutes;
    public Long getOfficeId() { return officeId; }
    public void setOfficeId(Long officeId) { this.officeId = officeId; }
    public Integer getMinutes() { return minutes; }
    public void setMinutes(Integer minutes) { this.minutes = minutes; }
  }
  public static class BalanceRequest {
    private Long employeeId;
    private String leaveType;
    private int year;
    private double allocatedDays;
    private double usedDays;
    public Long getEmployeeId() { return employeeId; }
    public void setEmployeeId(Long employeeId) { this.employeeId = employeeId; }
    public String getLeaveType() { return leaveType; }
    public void setLeaveType(String leaveType) { this.leaveType = leaveType; }
    public int getYear() { return year; }
    public void setYear(int year) { this.year = year; }
    public double getAllocatedDays() { return allocatedDays; }
    public void setAllocatedDays(double allocatedDays) { this.allocatedDays = allocatedDays; }
    public double getUsedDays() { return usedDays; }
    public void setUsedDays(double usedDays) { this.usedDays = usedDays; }
  }
  public static class PolicyRequest {
    private String versionName;
    public String getVersionName() { return versionName; }
    public void setVersionName(String versionName) { this.versionName = versionName; }
  }
  public static class LocationHolidayRequest {
    private Long officeId;
    private LocalDate date;
    private String name;
    public Long getOfficeId() { return officeId; }
    public void setOfficeId(Long officeId) { this.officeId = officeId; }
    public LocalDate getDate() { return date; }
    public void setDate(LocalDate date) { this.date = date; }
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
  }
  public static class MfaRequest {
    private boolean enabled;
    public boolean isEnabled() { return enabled; }
    public void setEnabled(boolean enabled) { this.enabled = enabled; }
  }
}
