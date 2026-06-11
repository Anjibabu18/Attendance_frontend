package com.attendance.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
import java.time.LocalTime;

@Entity
@Table(name = "work_shifts", uniqueConstraints = @UniqueConstraint(name = "uk_work_shifts_name", columnNames = "name"))
public class WorkShift {
  @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
  private Long id;
  @Column(nullable = false, length = 100)
  private String name;
  @Column(nullable = false)
  private LocalTime inTime;
  @Column(nullable = false)
  private LocalTime outTime;
  @Column(nullable = false)
  private boolean flexible;
  public Long getId() { return id; }
  public String getName() { return name; }
  public void setName(String name) { this.name = name; }
  public LocalTime getInTime() { return inTime; }
  public void setInTime(LocalTime inTime) { this.inTime = inTime; }
  public LocalTime getOutTime() { return outTime; }
  public void setOutTime(LocalTime outTime) { this.outTime = outTime; }
  public boolean isFlexible() { return flexible; }
  public void setFlexible(boolean flexible) { this.flexible = flexible; }
}
