package com.attendance.domain;

import jakarta.persistence.*;
import java.time.Instant;

@Entity
@Table(name = "attendance_policy_versions")
public class AttendancePolicyVersion {
  @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
  private Long id;
  @Column(nullable = false, length = 80)
  private String versionName;
  @Column(nullable = false)
  private Instant effectiveFrom;
  @Column(nullable = false, length = 1000)
  private String snapshotJson;
  public Long getId() { return id; }
  public String getVersionName() { return versionName; }
  public void setVersionName(String versionName) { this.versionName = versionName; }
  public Instant getEffectiveFrom() { return effectiveFrom; }
  public void setEffectiveFrom(Instant effectiveFrom) { this.effectiveFrom = effectiveFrom; }
  public String getSnapshotJson() { return snapshotJson; }
  public void setSnapshotJson(String snapshotJson) { this.snapshotJson = snapshotJson; }
}
