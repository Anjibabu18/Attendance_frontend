package com.attendance.api.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import com.attendance.domain.EmployeeStatus;
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;

public class AdminDtos {
  public static class CreateHrRequest {
    @NotBlank private String username;
    @NotBlank private String password;

    public String getUsername() {
      return username;
    }

    public void setUsername(String username) {
      this.username = username;
    }

    public String getPassword() {
      return password;
    }

    public void setPassword(String password) {
      this.password = password;
    }
  }

  public static class CreateCompanyRoleRequest {
    @NotBlank private String name;

    public String getName() {
      return name;
    }

    public void setName(String name) {
      this.name = name;
    }
  }

  public static class CreateEmployeeRequest {
    @NotBlank private String employeeNumber;
    @NotBlank private String name;
    @NotBlank private String username;
    @NotBlank private String password;
    @NotNull private Long companyRoleId;
    private Long officeLocationId;
    private Long departmentId;
    private Long shiftId;
    private LocalDate joinDate;

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

    public String getUsername() {
      return username;
    }

    public void setUsername(String username) {
      this.username = username;
    }

    public String getPassword() {
      return password;
    }

    public void setPassword(String password) {
      this.password = password;
    }

    public Long getCompanyRoleId() {
      return companyRoleId;
    }

    public void setCompanyRoleId(Long companyRoleId) {
      this.companyRoleId = companyRoleId;
    }

    public Long getOfficeLocationId() {
      return officeLocationId;
    }

    public void setOfficeLocationId(Long officeLocationId) {
      this.officeLocationId = officeLocationId;
    }

    public LocalDate getJoinDate() {
      return joinDate;
    }

    public void setJoinDate(LocalDate joinDate) {
      this.joinDate = joinDate;
    }

    public Long getDepartmentId() { return departmentId; }
    public void setDepartmentId(Long departmentId) { this.departmentId = departmentId; }
    public Long getShiftId() { return shiftId; }
    public void setShiftId(Long shiftId) { this.shiftId = shiftId; }
  }

  public static class CreateDepartmentRequest {
    @NotBlank private String name;
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
  }

  public static class CreateShiftRequest {
    @NotBlank private String name;
    @NotNull private LocalTime inTime;
    @NotNull private LocalTime outTime;
    private boolean flexible;
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public LocalTime getInTime() { return inTime; }
    public void setInTime(LocalTime inTime) { this.inTime = inTime; }
    public LocalTime getOutTime() { return outTime; }
    public void setOutTime(LocalTime outTime) { this.outTime = outTime; }
    public boolean isFlexible() { return flexible; }
    public void setFlexible(boolean flexible) { this.flexible = flexible; }
  }

  public static class UpdateEmployeeRequest {
    @NotBlank private String employeeNumber;
    @NotBlank private String name;
    @NotNull private Long companyRoleId;
    private Long officeLocationId;
    private Long departmentId;
    private Long shiftId;
    private LocalDate joinDate;
    public String getEmployeeNumber() { return employeeNumber; }
    public void setEmployeeNumber(String employeeNumber) { this.employeeNumber = employeeNumber; }
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public Long getCompanyRoleId() { return companyRoleId; }
    public void setCompanyRoleId(Long companyRoleId) { this.companyRoleId = companyRoleId; }
    public Long getOfficeLocationId() { return officeLocationId; }
    public void setOfficeLocationId(Long officeLocationId) { this.officeLocationId = officeLocationId; }
    public Long getDepartmentId() { return departmentId; }
    public void setDepartmentId(Long departmentId) { this.departmentId = departmentId; }
    public Long getShiftId() { return shiftId; }
    public void setShiftId(Long shiftId) { this.shiftId = shiftId; }
    public LocalDate getJoinDate() { return joinDate; }
    public void setJoinDate(LocalDate joinDate) { this.joinDate = joinDate; }
  }

  public static class SetEmployeeStatusRequest {
    @NotNull private EmployeeStatus status;
    private LocalDate exitDate;
    public EmployeeStatus getStatus() { return status; }
    public void setStatus(EmployeeStatus status) { this.status = status; }
    public LocalDate getExitDate() { return exitDate; }
    public void setExitDate(LocalDate exitDate) { this.exitDate = exitDate; }
  }

  public static class UpdateEmployeeUsernameRequest {
    @NotBlank private String username;
    public String getUsername() { return username; }
    public void setUsername(String username) { this.username = username; }
  }

  public static class BulkPasswordResetRequest {
    @NotNull private List<Long> employeeIds;
    @NotBlank private String newPassword;
    public List<Long> getEmployeeIds() { return employeeIds; }
    public void setEmployeeIds(List<Long> employeeIds) { this.employeeIds = employeeIds; }
    public String getNewPassword() { return newPassword; }
    public void setNewPassword(String newPassword) { this.newPassword = newPassword; }
  }

  public static class BulkEmployeeEditRequest {
    @NotNull private List<Long> employeeIds;
    private Long officeLocationId;
    private Long departmentId;
    private Long shiftId;
    private EmployeeStatus status;
    private String newPassword;
    public List<Long> getEmployeeIds() { return employeeIds; }
    public void setEmployeeIds(List<Long> employeeIds) { this.employeeIds = employeeIds; }
    public Long getOfficeLocationId() { return officeLocationId; }
    public void setOfficeLocationId(Long officeLocationId) { this.officeLocationId = officeLocationId; }
    public Long getDepartmentId() { return departmentId; }
    public void setDepartmentId(Long departmentId) { this.departmentId = departmentId; }
    public Long getShiftId() { return shiftId; }
    public void setShiftId(Long shiftId) { this.shiftId = shiftId; }
    public EmployeeStatus getStatus() { return status; }
    public void setStatus(EmployeeStatus status) { this.status = status; }
    public String getNewPassword() { return newPassword; }
    public void setNewPassword(String newPassword) { this.newPassword = newPassword; }
  }
}
