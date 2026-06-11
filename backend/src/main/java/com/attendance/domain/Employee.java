package com.attendance.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.OneToOne;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import java.time.LocalDate;

@Entity
@Table(
    name = "employees",
    uniqueConstraints = {
      @UniqueConstraint(name = "uk_employees_empno", columnNames = {"employee_number"}),
      @UniqueConstraint(name = "uk_employees_user_id", columnNames = {"user_id"})
    })
public class Employee {
  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  private Long id;

  @Column(name = "employee_number", nullable = false, length = 40)
  private String employeeNumber;

  @Column(nullable = false, length = 120)
  private String name;

  @OneToOne(fetch = FetchType.LAZY, optional = false)
  @JoinColumn(name = "user_id", nullable = false)
  private AppUser user;

  @ManyToOne(fetch = FetchType.LAZY)
  @JoinColumn(name = "company_role_id")
  private CompanyRole companyRole;

  @ManyToOne(fetch = FetchType.LAZY)
  @JoinColumn(name = "assigned_office_location_id")
  private OfficeLocation assignedOfficeLocation;

  @ManyToOne(fetch = FetchType.LAZY)
  @JoinColumn(name = "department_id")
  private Department department;

  @ManyToOne(fetch = FetchType.LAZY)
  @JoinColumn(name = "shift_id")
  private WorkShift shift;

  @Column(name = "join_date")
  private LocalDate joinDate;

  @Column(name = "profile_photo_url", length = 500)
  private String profilePhotoUrl;

  @Column(name = "profile_photo_public_id", length = 255)
  private String profilePhotoPublicId;

  @Enumerated(EnumType.STRING)
  @Column(nullable = false, length = 30)
  private EmployeeStatus status = EmployeeStatus.ACTIVE;

  @Column(name = "exit_date")
  private LocalDate exitDate;

  public Long getId() {
    return id;
  }

  public void setId(Long id) {
    this.id = id;
  }

  public String getEmployeeNumber() {
    return employeeNumber;
  }

  public void setEmployeeNumber(String employeeNumber) {
    this.employeeNumber = employeeNumber;
  }

  public String getName() {
    return name;
  }

  public void setName(String name) {
    this.name = name;
  }

  public AppUser getUser() {
    return user;
  }

  public void setUser(AppUser user) {
    this.user = user;
  }

  public CompanyRole getCompanyRole() {
    return companyRole;
  }

  public void setCompanyRole(CompanyRole companyRole) {
    this.companyRole = companyRole;
  }

  public OfficeLocation getAssignedOfficeLocation() {
    return assignedOfficeLocation;
  }

  public void setAssignedOfficeLocation(OfficeLocation assignedOfficeLocation) {
    this.assignedOfficeLocation = assignedOfficeLocation;
  }

  public Department getDepartment() {
    return department;
  }

  public void setDepartment(Department department) {
    this.department = department;
  }

  public WorkShift getShift() {
    return shift;
  }

  public void setShift(WorkShift shift) {
    this.shift = shift;
  }

  public LocalDate getJoinDate() {
    return joinDate;
  }

  public void setJoinDate(LocalDate joinDate) {
    this.joinDate = joinDate;
  }

  public String getProfilePhotoUrl() {
    return profilePhotoUrl;
  }

  public void setProfilePhotoUrl(String profilePhotoUrl) {
    this.profilePhotoUrl = profilePhotoUrl;
  }

  public String getProfilePhotoPublicId() {
    return profilePhotoPublicId;
  }

  public void setProfilePhotoPublicId(String profilePhotoPublicId) {
    this.profilePhotoPublicId = profilePhotoPublicId;
  }

  public EmployeeStatus getStatus() {
    return status;
  }

  public void setStatus(EmployeeStatus status) {
    this.status = status;
  }

  public LocalDate getExitDate() {
    return exitDate;
  }

  public void setExitDate(LocalDate exitDate) {
    this.exitDate = exitDate;
  }
}
