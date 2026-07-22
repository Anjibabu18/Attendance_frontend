package com.attendance.domain;

import jakarta.persistence.*;
import java.time.LocalDate;

@Entity
@Table(
    name = "shift_roster_assignments",
    uniqueConstraints = @UniqueConstraint(name = "uk_shift_roster_emp_date", columnNames = {"employee_id", "roster_date"}))
public class ShiftRosterAssignment {
  @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
  private Long id;
  @ManyToOne(fetch = FetchType.LAZY, optional = false) @JoinColumn(name = "employee_id", nullable = false)
  private Employee employee;
  @ManyToOne(fetch = FetchType.LAZY, optional = false) @JoinColumn(name = "shift_id", nullable = false)
  private WorkShift shift;
  @Column(name = "roster_date", nullable = false)
  private LocalDate date;
  public Long getId() { return id; }
  public Employee getEmployee() { return employee; }
  public void setEmployee(Employee employee) { this.employee = employee; }
  public WorkShift getShift() { return shift; }
  public void setShift(WorkShift shift) { this.shift = shift; }
  public LocalDate getDate() { return date; }
  public void setDate(LocalDate date) { this.date = date; }
}
