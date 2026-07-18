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
import java.time.LocalDate;

@Entity
@Table(name = "attendance_breaks")
public class AttendanceBreak {
  @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
  private Long id;
  @ManyToOne(fetch = FetchType.LAZY, optional = false)
  @JoinColumn(name = "employee_id", nullable = false)
  private Employee employee;
  @Column(nullable = false)
  private LocalDate date;
  @Column(nullable = false)
  private Instant breakStart;
  @Column
  private Instant breakEnd;
  public Long getId() { return id; }
  public Employee getEmployee() { return employee; }
  public void setEmployee(Employee employee) { this.employee = employee; }
  public LocalDate getDate() { return date; }
  public void setDate(LocalDate date) { this.date = date; }
  public Instant getBreakStart() { return breakStart; }
  public void setBreakStart(Instant breakStart) { this.breakStart = breakStart; }
  public Instant getBreakEnd() { return breakEnd; }
  public void setBreakEnd(Instant breakEnd) { this.breakEnd = breakEnd; }
}
