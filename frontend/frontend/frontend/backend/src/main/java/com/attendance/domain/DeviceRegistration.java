package com.attendance.domain;

import jakarta.persistence.*;
import java.time.Instant;

@Entity
@Table(name = "device_registrations", uniqueConstraints = @UniqueConstraint(name = "uk_device_user_device", columnNames = {"user_id", "device_id"}))
public class DeviceRegistration {
  @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
  private Long id;
  @ManyToOne(fetch = FetchType.LAZY, optional = false) @JoinColumn(name = "user_id", nullable = false)
  private AppUser user;
  @Column(name = "device_id", nullable = false, length = 120)
  private String deviceId;
  @Column(length = 160)
  private String label;
  @Column(nullable = false)
  private boolean approved;
  @Column(nullable = false)
  private Instant createdAt = Instant.now();
  public Long getId() { return id; }
  public AppUser getUser() { return user; }
  public void setUser(AppUser user) { this.user = user; }
  public String getDeviceId() { return deviceId; }
  public void setDeviceId(String deviceId) { this.deviceId = deviceId; }
  public String getLabel() { return label; }
  public void setLabel(String label) { this.label = label; }
  public boolean isApproved() { return approved; }
  public void setApproved(boolean approved) { this.approved = approved; }
  public Instant getCreatedAt() { return createdAt; }
  public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }
}
