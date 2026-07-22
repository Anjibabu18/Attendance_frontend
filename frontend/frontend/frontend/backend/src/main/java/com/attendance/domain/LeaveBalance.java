package com.attendance.domain;

import jakarta.persistence.*;

@Entity
@Table(name = "leave_balances", uniqueConstraints = @UniqueConstraint(name = "uk_leave_balance_emp_type_year", columnNames = {"employee_id", "leave_type", "year_value"}))
public class LeaveBalance {
  @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
  private Long id;
  @ManyToOne(fetch = FetchType.LAZY, optional = false) @JoinColumn(name = "employee_id", nullable = false)
  private Employee employee;
  @Column(name = "leave_type", nullable = false, length = 40)
  private String leaveType;
  @Column(name = "year_value", nullable = false)
  private int year;
  @Column(nullable = false)
  private double allocatedDays;
  @Column(nullable = false)
  private double usedDays;
  public Long getId() { return id; }
  public Employee getEmployee() { return employee; }
  public void setEmployee(Employee employee) { this.employee = employee; }
  public String getLeaveType() { return leaveType; }
  public void setLeaveType(String leaveType) { this.leaveType = leaveType; }
  public int getYear() { return year; }
  public void setYear(int year) { this.year = year; }
  public double getAllocatedDays() { return allocatedDays; }
  public void setAllocatedDays(double allocatedDays) { this.allocatedDays = allocatedDays; }
  public double getUsedDays() { return usedDays; }
  public void setUsedDays(double usedDays) { this.usedDays = usedDays; }
}
