package com.attendance.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import java.time.Instant;

@Entity
@Table(name = "punch_attempts")
public class PunchAttempt {
  @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
  private Long id;
  @ManyToOne(fetch = FetchType.LAZY)
  @JoinColumn(name = "employee_id")
  private Employee employee;
  @Column(nullable = false, length = 40)
  private String type;
  @Column private Double latitude;
  @Column private Double longitude;
  @Column private Double distanceMeters;
  @Column(nullable = false)
  private boolean success;
  @Column(length = 255)
  private String message;
  @Column(nullable = false)
  private Instant createdAt = Instant.now();
  public Long getId() { return id; }
  public Employee getEmployee() { return employee; }
  public void setEmployee(Employee employee) { this.employee = employee; }
  public String getType() { return type; }
  public void setType(String type) { this.type = type; }
  public Double getLatitude() { return latitude; }
  public void setLatitude(Double latitude) { this.latitude = latitude; }
  public Double getLongitude() { return longitude; }
  public void setLongitude(Double longitude) { this.longitude = longitude; }
  public Double getDistanceMeters() { return distanceMeters; }
  public void setDistanceMeters(Double distanceMeters) { this.distanceMeters = distanceMeters; }
  public boolean isSuccess() { return success; }
  public void setSuccess(boolean success) { this.success = success; }
  public String getMessage() { return message; }
  public void setMessage(String message) { this.message = message; }
  public Instant getCreatedAt() { return createdAt; }
  public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }
}
