package com.attendance.api.dto;

import com.attendance.domain.AttendanceStatus;
import jakarta.validation.constraints.NotNull;
import java.time.LocalDate;
import java.time.LocalTime;

public class AttendanceDtos {
  public static class UpsertAttendanceRequest {
    @NotNull private Long employeeId;
    @NotNull private LocalDate date;
    private LocalTime inTime;
    private LocalTime outTime;
    private String leaveReason;

    public Long getEmployeeId() {
      return employeeId;
    }

    public void setEmployeeId(Long employeeId) {
      this.employeeId = employeeId;
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

    public String getLeaveReason() {
      return leaveReason;
    }

    public void setLeaveReason(String leaveReason) {
      this.leaveReason = leaveReason;
    }
  }

  public static class AttendanceResponse {
    private Long id;
    private Long employeeId;
    private LocalDate date;
    private LocalTime inTime;
    private LocalTime outTime;
    private Integer workedMinutes;
    private Integer lateMinutes;
    private Integer earlyLeaveMinutes;
    private Integer overtimeMinutes;
    private String leaveReason;
    private Double checkInLatitude;
    private Double checkInLongitude;
    private String checkInPhotoUrl;
    private Double checkInFaceScore;
    private Boolean checkInFaceVerified;
    private Double checkOutLatitude;
    private Double checkOutLongitude;
    private String checkOutPhotoUrl;
    private Double checkOutFaceScore;
    private Boolean checkOutFaceVerified;
    private AttendanceStatus status;

    public AttendanceResponse(
        Long id,
        Long employeeId,
        LocalDate date,
        LocalTime inTime,
        LocalTime outTime,
        Integer workedMinutes,
        Integer lateMinutes,
        Integer earlyLeaveMinutes,
        Integer overtimeMinutes,
        String leaveReason,
        Double checkInLatitude,
        Double checkInLongitude,
        String checkInPhotoUrl,
        Double checkInFaceScore,
        Boolean checkInFaceVerified,
        Double checkOutLatitude,
        Double checkOutLongitude,
        String checkOutPhotoUrl,
        Double checkOutFaceScore,
        Boolean checkOutFaceVerified,
        AttendanceStatus status) {
      this.id = id;
      this.employeeId = employeeId;
      this.date = date;
      this.inTime = inTime;
      this.outTime = outTime;
      this.workedMinutes = workedMinutes;
      this.lateMinutes = lateMinutes;
      this.earlyLeaveMinutes = earlyLeaveMinutes;
      this.overtimeMinutes = overtimeMinutes;
      this.leaveReason = leaveReason;
      this.checkInLatitude = checkInLatitude;
      this.checkInLongitude = checkInLongitude;
      this.checkInPhotoUrl = checkInPhotoUrl;
      this.checkInFaceScore = checkInFaceScore;
      this.checkInFaceVerified = checkInFaceVerified;
      this.checkOutLatitude = checkOutLatitude;
      this.checkOutLongitude = checkOutLongitude;
      this.checkOutPhotoUrl = checkOutPhotoUrl;
      this.checkOutFaceScore = checkOutFaceScore;
      this.checkOutFaceVerified = checkOutFaceVerified;
      this.status = status;
    }

    public Long getId() {
      return id;
    }

    public Long getEmployeeId() {
      return employeeId;
    }

    public LocalDate getDate() {
      return date;
    }

    public LocalTime getInTime() {
      return inTime;
    }

    public LocalTime getOutTime() {
      return outTime;
    }

    public Integer getWorkedMinutes() {
      return workedMinutes;
    }

    public Integer getLateMinutes() {
      return lateMinutes;
    }

    public Integer getEarlyLeaveMinutes() {
      return earlyLeaveMinutes;
    }

    public Integer getOvertimeMinutes() {
      return overtimeMinutes;
    }

    public String getLeaveReason() {
      return leaveReason;
    }

    public Double getCheckInLatitude() {
      return checkInLatitude;
    }

    public Double getCheckInLongitude() {
      return checkInLongitude;
    }

    public String getCheckInPhotoUrl() {
      return checkInPhotoUrl;
    }

    public Double getCheckInFaceScore() {
      return checkInFaceScore;
    }

    public Boolean getCheckInFaceVerified() {
      return checkInFaceVerified;
    }

    public Double getCheckOutLatitude() {
      return checkOutLatitude;
    }

    public Double getCheckOutLongitude() {
      return checkOutLongitude;
    }

    public String getCheckOutPhotoUrl() {
      return checkOutPhotoUrl;
    }

    public Double getCheckOutFaceScore() {
      return checkOutFaceScore;
    }

    public Boolean getCheckOutFaceVerified() {
      return checkOutFaceVerified;
    }

    public AttendanceStatus getStatus() {
      return status;
    }
  }

  public static class UpsertAttendanceRangeRequest {
    @NotNull private Long employeeId;
    @NotNull private LocalDate fromDate;
    @NotNull private LocalDate toDate;
    private LocalTime inTime;
    private LocalTime outTime;
    private String leaveReason;

    public Long getEmployeeId() {
      return employeeId;
    }

    public void setEmployeeId(Long employeeId) {
      this.employeeId = employeeId;
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

    public String getLeaveReason() {
      return leaveReason;
    }

    public void setLeaveReason(String leaveReason) {
      this.leaveReason = leaveReason;
    }
  }

  public static class PunchPlaceResponse {
    private OfficeDtos.OfficeLocationResponse officeLocation;
    private double latitude;
    private double longitude;
    private double distanceMeters;
    private double allowedRadiusMeters;
    private boolean insideRadius;

    public PunchPlaceResponse(
        OfficeDtos.OfficeLocationResponse officeLocation,
        double latitude,
        double longitude,
        double distanceMeters,
        double allowedRadiusMeters,
        boolean insideRadius) {
      this.officeLocation = officeLocation;
      this.latitude = latitude;
      this.longitude = longitude;
      this.distanceMeters = distanceMeters;
      this.allowedRadiusMeters = allowedRadiusMeters;
      this.insideRadius = insideRadius;
    }

    public OfficeDtos.OfficeLocationResponse getOfficeLocation() {
      return officeLocation;
    }

    public double getLatitude() {
      return latitude;
    }

    public double getLongitude() {
      return longitude;
    }

    public double getDistanceMeters() {
      return distanceMeters;
    }

    public double getAllowedRadiusMeters() {
      return allowedRadiusMeters;
    }

    public boolean isInsideRadius() {
      return insideRadius;
    }
  }
}
