package com.attendance.api.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import java.time.Instant;

public class OfficeDtos {
  public static class UpsertOfficeLocationRequest {
    private String officeName;

    @NotNull
    @Min(-90)
    @Max(90)
    private Double latitude;

    @NotNull
    @Min(-180)
    @Max(180)
    private Double longitude;

    @NotNull
    @Min(1)
    private Double radiusMeters;

    public String getOfficeName() {
      return officeName;
    }

    public void setOfficeName(String officeName) {
      this.officeName = officeName;
    }

    public Double getLatitude() {
      return latitude;
    }

    public void setLatitude(Double latitude) {
      this.latitude = latitude;
    }

    public Double getLongitude() {
      return longitude;
    }

    public void setLongitude(Double longitude) {
      this.longitude = longitude;
    }

    public Double getRadiusMeters() {
      return radiusMeters;
    }

    public void setRadiusMeters(Double radiusMeters) {
      this.radiusMeters = radiusMeters;
    }
  }

  public static class AssignEmployeeOfficeRequest {
    private Long officeLocationId;

    public Long getOfficeLocationId() {
      return officeLocationId;
    }

    public void setOfficeLocationId(Long officeLocationId) {
      this.officeLocationId = officeLocationId;
    }
  }

  public static class OfficeLocationResponse {
    private Long id;
    private String officeName;
    private double latitude;
    private double longitude;
    private double radiusMeters;
    private boolean active;
    private Instant updatedAt;

    public OfficeLocationResponse(
        Long id,
        String officeName,
        double latitude,
        double longitude,
        double radiusMeters,
        boolean active,
        Instant updatedAt) {
      this.id = id;
      this.officeName = officeName;
      this.latitude = latitude;
      this.longitude = longitude;
      this.radiusMeters = radiusMeters;
      this.active = active;
      this.updatedAt = updatedAt;
    }

    public Long getId() {
      return id;
    }

    public String getOfficeName() {
      return officeName;
    }

    public double getLatitude() {
      return latitude;
    }

    public double getLongitude() {
      return longitude;
    }

    public double getRadiusMeters() {
      return radiusMeters;
    }

    public boolean isActive() {
      return active;
    }

    public Instant getUpdatedAt() {
      return updatedAt;
    }
  }
}
