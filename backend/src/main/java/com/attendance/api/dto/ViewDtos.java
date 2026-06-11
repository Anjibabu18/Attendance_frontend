package com.attendance.api.dto;

public class ViewDtos {
  public static class DepartmentView {
    private final Long id;
    private final String name;
    public DepartmentView(Long id, String name) { this.id = id; this.name = name; }
    public Long getId() { return id; }
    public String getName() { return name; }
  }

  public static class ShiftView {
    private final Long id;
    private final String name;
    private final java.time.LocalTime inTime;
    private final java.time.LocalTime outTime;
    private final boolean flexible;
    public ShiftView(Long id, String name, java.time.LocalTime inTime, java.time.LocalTime outTime, boolean flexible) {
      this.id = id; this.name = name; this.inTime = inTime; this.outTime = outTime; this.flexible = flexible;
    }
    public Long getId() { return id; }
    public String getName() { return name; }
    public java.time.LocalTime getInTime() { return inTime; }
    public java.time.LocalTime getOutTime() { return outTime; }
    public boolean isFlexible() { return flexible; }
  }
  public static class CompanyRoleView {
    private Long id;
    private String name;
    private String photoUrl;

    public CompanyRoleView(Long id, String name, String photoUrl) {
      this.id = id;
      this.name = name;
      this.photoUrl = photoUrl;
    }

    public Long getId() {
      return id;
    }

    public String getName() {
      return name;
    }

    public String getPhotoUrl() {
      return photoUrl;
    }
  }

  public static class EmployeeView {
    private Long id;
    private String employeeNumber;
    private String name;
    private String loginRole;
    private String username;
    private CompanyRoleView companyRole;
    private OfficeDtos.OfficeLocationResponse assignedOfficeLocation;
    private DepartmentView department;
    private ShiftView shift;
    private Boolean enabled;
    private java.time.Instant lastLoginAt;
    private String lastLoginIp;
    private String status;
    private String profilePhotoUrl;
    private java.time.LocalDate joinDate;
    private java.time.LocalDate exitDate;

    public EmployeeView(
        Long id,
        String employeeNumber,
        String name,
        String loginRole,
        CompanyRoleView companyRole,
        OfficeDtos.OfficeLocationResponse assignedOfficeLocation) {
      this.id = id;
      this.employeeNumber = employeeNumber;
      this.name = name;
      this.loginRole = loginRole;
      this.companyRole = companyRole;
      this.assignedOfficeLocation = assignedOfficeLocation;
    }

    public EmployeeView(
        Long id,
        String employeeNumber,
        String name,
        String loginRole,
        CompanyRoleView companyRole,
        OfficeDtos.OfficeLocationResponse assignedOfficeLocation,
        DepartmentView department,
        ShiftView shift,
        Boolean enabled,
        java.time.Instant lastLoginAt,
        String lastLoginIp) {
      this(id, employeeNumber, name, loginRole, companyRole, assignedOfficeLocation);
      this.department = department;
      this.shift = shift;
      this.enabled = enabled;
      this.lastLoginAt = lastLoginAt;
      this.lastLoginIp = lastLoginIp;
    }

    public EmployeeView(
        Long id,
        String employeeNumber,
        String name,
        String loginRole,
        CompanyRoleView companyRole,
        OfficeDtos.OfficeLocationResponse assignedOfficeLocation,
        DepartmentView department,
        ShiftView shift,
        Boolean enabled,
        java.time.Instant lastLoginAt,
        String lastLoginIp,
        String status,
        String profilePhotoUrl,
        java.time.LocalDate joinDate,
        java.time.LocalDate exitDate) {
      this(id, employeeNumber, name, loginRole, companyRole, assignedOfficeLocation, department, shift, enabled, lastLoginAt, lastLoginIp);
      this.status = status;
      this.profilePhotoUrl = profilePhotoUrl;
      this.joinDate = joinDate;
      this.exitDate = exitDate;
    }

    public Long getId() {
      return id;
    }

    public String getEmployeeNumber() {
      return employeeNumber;
    }

    public String getName() {
      return name;
    }

    public String getLoginRole() {
      return loginRole;
    }

    public String getUsername() {
      return username;
    }

    public void setUsername(String username) {
      this.username = username;
    }

    public CompanyRoleView getCompanyRole() {
      return companyRole;
    }

    public OfficeDtos.OfficeLocationResponse getAssignedOfficeLocation() {
      return assignedOfficeLocation;
    }

    public DepartmentView getDepartment() { return department; }
    public ShiftView getShift() { return shift; }
    public Boolean getEnabled() { return enabled; }
    public java.time.Instant getLastLoginAt() { return lastLoginAt; }
    public String getLastLoginIp() { return lastLoginIp; }
    public String getStatus() { return status; }
    public String getProfilePhotoUrl() { return profilePhotoUrl; }
    public java.time.LocalDate getJoinDate() { return joinDate; }
    public java.time.LocalDate getExitDate() { return exitDate; }
  }

  public static class EmployeeProfileView {
    private Long employeeId;
    private String employeeNumber;
    private String name;
    private CompanyRoleView companyRole;
    private OfficeDtos.OfficeLocationResponse assignedOfficeLocation;
    private DepartmentView department;
    private ShiftView shift;
    private String status;
    private String profilePhotoUrl;

    public EmployeeProfileView(
        Long employeeId,
        String employeeNumber,
        String name,
        CompanyRoleView companyRole,
        OfficeDtos.OfficeLocationResponse assignedOfficeLocation) {
      this.employeeId = employeeId;
      this.employeeNumber = employeeNumber;
      this.name = name;
      this.companyRole = companyRole;
      this.assignedOfficeLocation = assignedOfficeLocation;
    }

    public EmployeeProfileView(
        Long employeeId,
        String employeeNumber,
        String name,
        CompanyRoleView companyRole,
        OfficeDtos.OfficeLocationResponse assignedOfficeLocation,
        DepartmentView department,
        ShiftView shift) {
      this(employeeId, employeeNumber, name, companyRole, assignedOfficeLocation);
      this.department = department;
      this.shift = shift;
    }

    public EmployeeProfileView(
        Long employeeId,
        String employeeNumber,
        String name,
        CompanyRoleView companyRole,
        OfficeDtos.OfficeLocationResponse assignedOfficeLocation,
        DepartmentView department,
        ShiftView shift,
        String status,
        String profilePhotoUrl) {
      this(employeeId, employeeNumber, name, companyRole, assignedOfficeLocation, department, shift);
      this.status = status;
      this.profilePhotoUrl = profilePhotoUrl;
    }

    public Long getEmployeeId() {
      return employeeId;
    }

    public String getEmployeeNumber() {
      return employeeNumber;
    }

    public String getName() {
      return name;
    }

    public CompanyRoleView getCompanyRole() {
      return companyRole;
    }

    public OfficeDtos.OfficeLocationResponse getAssignedOfficeLocation() {
      return assignedOfficeLocation;
    }

    public DepartmentView getDepartment() { return department; }
    public ShiftView getShift() { return shift; }
    public String getStatus() { return status; }
    public String getProfilePhotoUrl() { return profilePhotoUrl; }
  }
}
