package com.attendance.domain;

import jakarta.persistence.*;
import java.time.Instant;

@Entity
@Table(name = "attendance_exceptions")
public class AttendanceException {
  @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
  private Long id;
  @ManyToOne(fetch = FetchType.LAZY) @JoinColumn(name = "employee_id")
  private Employee employee;
  @Column(nullable = false, length = 60)
  private String type;
  @Column(nullable = false, length = 500)
  private String message;
  @Column(nullable = false)
  private boolean resolved;
  @Column(nullable = false)
  private Instant createdAt = Instant.now();
  public Long getId() { return id; }
  public Employee getEmployee() { return employee; }
  public void setEmployee(Employee employee) { this.employee = employee; }
  public String getType() { return type; }
  public void setType(String type) { this.type = type; }
  public String getMessage() { return message; }
  public void setMessage(String message) { this.message = message; }
  public boolean isResolved() { return resolved; }
  public void setResolved(boolean resolved) { this.resolved = resolved; }
  public Instant getCreatedAt() { return createdAt; }
  public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }
}
