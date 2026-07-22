package com.attendance.domain;

import jakarta.persistence.*;
import java.time.Instant;

@Entity
@Table(name = "payroll_locks", uniqueConstraints = @UniqueConstraint(name = "uk_payroll_lock_month", columnNames = "month_value"))
public class PayrollLock {
  @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
  private Long id;
  @Column(name = "month_value", nullable = false, length = 7)
  private String month;
  @Column(nullable = false)
  private boolean locked;
  @Column(nullable = false)
  private Instant updatedAt = Instant.now();
  @Column(length = 120)
  private String updatedBy;

  public Long getId() { return id; }
  public String getMonth() { return month; }
  public void setMonth(String month) { this.month = month; }
  public boolean isLocked() { return locked; }
  public void setLocked(boolean locked) { this.locked = locked; }
  public Instant getUpdatedAt() { return updatedAt; }
  public void setUpdatedAt(Instant updatedAt) { this.updatedAt = updatedAt; }
  public String getUpdatedBy() { return updatedBy; }
  public void setUpdatedBy(String updatedBy) { this.updatedBy = updatedBy; }
}
