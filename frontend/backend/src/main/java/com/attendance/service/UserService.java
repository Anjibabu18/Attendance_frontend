package com.attendance.service;

import com.attendance.domain.AppUser;
import com.attendance.domain.Employee;
import com.attendance.domain.EmployeeStatus;
import com.attendance.domain.CompanyRole;
import com.attendance.domain.Department;
import com.attendance.domain.OfficeLocation;
import com.attendance.domain.Role;
import com.attendance.domain.WorkShift;
import com.attendance.config.AppConfig;
import com.attendance.repo.EmployeeRepository;
import com.attendance.repo.CompanyRoleRepository;
import com.attendance.repo.DepartmentRepository;
import com.attendance.repo.OfficeLocationRepository;
import com.attendance.repo.UserRepository;
import com.attendance.repo.WorkShiftRepository;
import com.attendance.security.PasswordPolicy;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class UserService {
  private final UserRepository userRepository;
  private final EmployeeRepository employeeRepository;
  private final CompanyRoleRepository companyRoleRepository;
  private final OfficeLocationRepository officeLocationRepository;
  private final DepartmentRepository departmentRepository;
  private final WorkShiftRepository workShiftRepository;
  private final PasswordEncoder passwordEncoder;
  private final PasswordPolicy passwordPolicy;
  private final AppConfig appConfig;
  private final AuditLogService auditLogService;
  private final NotificationService notificationService;

  public UserService(
      UserRepository userRepository,
      EmployeeRepository employeeRepository,
      CompanyRoleRepository companyRoleRepository,
      OfficeLocationRepository officeLocationRepository,
      DepartmentRepository departmentRepository,
      WorkShiftRepository workShiftRepository,
      PasswordEncoder passwordEncoder,
      PasswordPolicy passwordPolicy,
      AppConfig appConfig,
      AuditLogService auditLogService,
      NotificationService notificationService) {
    this.userRepository = userRepository;
    this.employeeRepository = employeeRepository;
    this.companyRoleRepository = companyRoleRepository;
    this.officeLocationRepository = officeLocationRepository;
    this.departmentRepository = departmentRepository;
    this.workShiftRepository = workShiftRepository;
    this.passwordEncoder = passwordEncoder;
    this.passwordPolicy = passwordPolicy;
    this.appConfig = appConfig;
    this.auditLogService = auditLogService;
    this.notificationService = notificationService;
  }

  public Optional<AppUser> findByUsername(String username) {
    return userRepository.findByUsername(username);
  }

  public Optional<Employee> findEmployeeByUserId(Long userId) {
    return employeeRepository.findByUser_Id(userId);
  }

  @Transactional
  public AppUser createHr(String username, String password) {
    passwordPolicy.validate(password);
    if (userRepository.existsByUsername(username)) {
      throw new ApiException(HttpStatus.CONFLICT, "Username already exists");
    }
    AppUser user = new AppUser();
    user.setUsername(username);
    user.setPasswordHash(passwordEncoder.encode(password));
    user.setRole(Role.ROLE_HR);
    AppUser saved = userRepository.save(user);
    auditLogService.record("admin", "HR_CREATED", "USER", saved.getId(), "username=" + saved.getUsername());
    return saved;
  }

  @Transactional
  public AppUser createManager(String username, String password) {
    passwordPolicy.validate(password);
    if (userRepository.existsByUsername(username)) {
      throw new ApiException(HttpStatus.CONFLICT, "Username already exists");
    }
    AppUser user = new AppUser();
    user.setUsername(username);
    user.setPasswordHash(passwordEncoder.encode(password));
    user.setRole(Role.ROLE_MANAGER);
    AppUser saved = userRepository.save(user);
    auditLogService.record("admin", "MANAGER_CREATED", "USER", saved.getId(), "username=" + saved.getUsername());
    return saved;
  }

  @Transactional
  public Employee createEmployee(
      String employeeNumber,
      String name,
      String username,
      String password,
      Long companyRoleId,
      Long officeLocationId,
      Long departmentId,
      Long shiftId,
      LocalDate joinDate) {
    passwordPolicy.validate(password);
    if (employeeRepository.existsByEmployeeNumber(employeeNumber)) {
      throw new ApiException(HttpStatus.CONFLICT, "Employee number already exists");
    }
    if (userRepository.existsByUsername(username)) {
      throw new ApiException(HttpStatus.CONFLICT, "Username already exists");
    }
    CompanyRole companyRole =
        companyRoleRepository
            .findById(companyRoleId)
            .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Company role not found"));
    OfficeLocation officeLocation =
        resolveOffice(officeLocationId);
    Department department = resolveDepartment(departmentId);
    WorkShift shift = resolveShift(shiftId);

    AppUser user = new AppUser();
    user.setUsername(username);
    user.setPasswordHash(passwordEncoder.encode(password));
    user.setRole(Role.ROLE_EMPLOYEE);
    user = userRepository.save(user);

    Employee emp = new Employee();
    emp.setEmployeeNumber(employeeNumber);
    emp.setName(name);
    emp.setUser(user);
    emp.setCompanyRole(companyRole);
    emp.setAssignedOfficeLocation(officeLocation);
    emp.setDepartment(department);
    emp.setShift(shift);
    emp.setJoinDate(joinDate != null ? joinDate : defaultJoinDate());
    Employee saved = employeeRepository.save(emp);
    auditLogService.record("admin", "EMPLOYEE_CREATED", "EMPLOYEE", saved.getId(), "employeeNumber=" + saved.getEmployeeNumber());
    return saved;
  }

  @Transactional
  public Employee updateEmployee(
      Long employeeId,
      String employeeNumber,
      String name,
      Long companyRoleId,
      Long officeLocationId,
      Long departmentId,
      Long shiftId,
      LocalDate joinDate) {
    Employee employee =
        employeeRepository
            .findById(employeeId)
            .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Employee not found"));
    if (!employee.getEmployeeNumber().equals(employeeNumber) && employeeRepository.existsByEmployeeNumber(employeeNumber)) {
      throw new ApiException(HttpStatus.CONFLICT, "Employee number already exists");
    }
    CompanyRole companyRole =
        companyRoleRepository
            .findById(companyRoleId)
            .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Company role not found"));
    employee.setEmployeeNumber(employeeNumber.trim());
    employee.setName(name.trim());
    employee.setCompanyRole(companyRole);
    employee.setAssignedOfficeLocation(resolveOffice(officeLocationId));
    employee.setDepartment(resolveDepartment(departmentId));
    employee.setShift(resolveShift(shiftId));
    employee.setJoinDate(joinDate != null ? joinDate : employee.getJoinDate());
    Employee saved = employeeRepository.save(employee);
    auditLogService.record("admin", "EMPLOYEE_UPDATED", "EMPLOYEE", saved.getId(), "employeeNumber=" + saved.getEmployeeNumber());
    return saved;
  }

  @Transactional
  public Employee updateEmployeeUsername(Long employeeId, String username, String actorUsername) {
    String nextUsername = username == null ? "" : username.trim();
    if (nextUsername.isBlank()) {
      throw new ApiException(HttpStatus.BAD_REQUEST, "Username is required");
    }
    Employee employee =
        employeeRepository
            .findById(employeeId)
            .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Employee not found"));
    AppUser user = employee.getUser();
    if (user == null) {
      throw new ApiException(HttpStatus.CONFLICT, "Employee login account missing");
    }
    if (user.getUsername().equals(nextUsername)) {
      return employee;
    }
    if (userRepository.existsByUsername(nextUsername)) {
      throw new ApiException(HttpStatus.CONFLICT, "Username already exists");
    }
    String oldUsername = user.getUsername();
    user.setUsername(nextUsername);
    userRepository.save(user);
    auditLogService.record(
        actorUsername,
        "EMPLOYEE_USERNAME_UPDATED",
        "USER",
        user.getId(),
        "employee=" + employee.getEmployeeNumber() + ", oldUsername=" + oldUsername + ", newUsername=" + nextUsername);
    return employee;
  }

  @Transactional
  public Employee setEmployeeEnabled(Long employeeId, boolean enabled, String actorUsername) {
    Employee employee =
        employeeRepository
            .findById(employeeId)
            .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Employee not found"));
    employee.getUser().setEnabled(enabled);
    userRepository.save(employee.getUser());
    auditLogService.record(actorUsername, enabled ? "USER_ENABLED" : "USER_DISABLED", "USER", employee.getUser().getId(), "employee=" + employee.getEmployeeNumber());
    return employee;
  }

  @Transactional
  public Employee setEmployeeStatus(Long employeeId, EmployeeStatus status, LocalDate exitDate, String actorUsername) {
    Employee employee =
        employeeRepository
            .findById(employeeId)
            .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Employee not found"));
    if (status == null) {
      throw new ApiException(HttpStatus.BAD_REQUEST, "status is required");
    }
    employee.setStatus(status);
    employee.setExitDate(status == EmployeeStatus.RESIGNED ? exitDate : null);
    boolean enabled = status != EmployeeStatus.INACTIVE && status != EmployeeStatus.RESIGNED;
    employee.getUser().setEnabled(enabled);
    userRepository.save(employee.getUser());
    Employee saved = employeeRepository.save(employee);
    auditLogService.record(actorUsername, "EMPLOYEE_STATUS_CHANGED", "EMPLOYEE", saved.getId(), "status=" + status.name());
    return saved;
  }

  @Transactional
  public Employee assignOfficeLocation(Long employeeId, Long officeLocationId) {
    Employee employee =
        employeeRepository
            .findById(employeeId)
            .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Employee not found"));
    OfficeLocation officeLocation =
        officeLocationId == null
            ? null
            : officeLocationRepository
                .findById(officeLocationId)
                .filter(OfficeLocation::isActive)
                .orElseThrow(
                    () -> new ApiException(HttpStatus.NOT_FOUND, "Office location not found"));
    employee.setAssignedOfficeLocation(officeLocation);
    Employee saved = employeeRepository.save(employee);
    auditLogService.record("admin", "EMPLOYEE_OFFICE_ASSIGNED", "EMPLOYEE", saved.getId(), officeLocation == null ? "default office" : "office=" + officeLocation.getId());
    return saved;
  }

  @Transactional
  public void changePassword(String username, String currentPassword, String newPassword) {
    passwordPolicy.validate(newPassword);
    AppUser user =
        userRepository
            .findByUsername(username)
            .orElseThrow(() -> new ApiException(HttpStatus.UNAUTHORIZED, "Invalid token"));
    if (!passwordEncoder.matches(currentPassword, user.getPasswordHash())) {
      throw new ApiException(HttpStatus.BAD_REQUEST, "Current password is incorrect");
    }
    user.setPasswordHash(passwordEncoder.encode(newPassword));
    userRepository.save(user);
    auditLogService.record(username, "PASSWORD_CHANGED", "USER", user.getId(), null);
  }

  @Transactional
  public void resetPassword(Long userId, String newPassword, String actorUsername) {
    passwordPolicy.validate(newPassword);
    AppUser user =
        userRepository
            .findById(userId)
            .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "User not found"));
    user.setPasswordHash(passwordEncoder.encode(newPassword));
    userRepository.save(user);
    auditLogService.record(actorUsername, "PASSWORD_RESET", "USER", user.getId(), "username=" + user.getUsername());
    notificationService.notify(user, "Password reset", "Your password was reset by an administrator.");
  }

  @Transactional
  public int resetEmployeePasswords(List<Long> employeeIds, String newPassword, String actorUsername) {
    if (employeeIds == null || employeeIds.isEmpty()) {
      throw new ApiException(HttpStatus.BAD_REQUEST, "employeeIds are required");
    }
    passwordPolicy.validate(newPassword);
    int changed = 0;
    for (Long employeeId : employeeIds) {
      Employee employee =
          employeeRepository
              .findById(employeeId)
              .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Employee not found: " + employeeId));
      employee.getUser().setPasswordHash(passwordEncoder.encode(newPassword));
      userRepository.save(employee.getUser());
      notificationService.notify(employee.getUser(), "Password reset", "Your password was reset by an administrator.");
      changed++;
    }
    auditLogService.record(actorUsername, "BULK_PASSWORD_RESET", "USER", "bulk", "count=" + changed);
    return changed;
  }

  @Transactional
  public int bulkEditEmployees(
      List<Long> employeeIds,
      Long officeLocationId,
      Long departmentId,
      Long shiftId,
      EmployeeStatus status,
      String newPassword,
      String actorUsername) {
    if (employeeIds == null || employeeIds.isEmpty()) {
      throw new ApiException(HttpStatus.BAD_REQUEST, "employeeIds are required");
    }
    if (newPassword != null && !newPassword.isBlank()) passwordPolicy.validate(newPassword);
    int changed = 0;
    for (Long employeeId : employeeIds) {
      Employee employee =
          employeeRepository
              .findById(employeeId)
              .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Employee not found: " + employeeId));
      if (officeLocationId != null) employee.setAssignedOfficeLocation(resolveOffice(officeLocationId));
      if (departmentId != null) employee.setDepartment(resolveDepartment(departmentId));
      if (shiftId != null) employee.setShift(resolveShift(shiftId));
      if (status != null) {
        employee.setStatus(status);
        employee.setExitDate(status == EmployeeStatus.RESIGNED ? AttendanceClock.today() : null);
        employee.getUser().setEnabled(status != EmployeeStatus.INACTIVE && status != EmployeeStatus.RESIGNED);
      }
      if (newPassword != null && !newPassword.isBlank()) {
        employee.getUser().setPasswordHash(passwordEncoder.encode(newPassword));
        notificationService.notify(employee.getUser(), "Password reset", "Your password was reset by an administrator.");
      }
      userRepository.save(employee.getUser());
      employeeRepository.save(employee);
      changed++;
    }
    auditLogService.record(actorUsername, "BULK_EMPLOYEE_EDIT", "EMPLOYEE", "bulk", "count=" + changed);
    return changed;
  }

  private LocalDate defaultJoinDate() {
    String raw = appConfig.getAttendance().getDefaultJoinDate();
    if (raw == null || raw.isBlank()) return AttendanceClock.today();
    try {
      return LocalDate.parse(raw.trim());
    } catch (Exception ignored) {
      return AttendanceClock.today();
    }
  }

  private OfficeLocation resolveOffice(Long officeLocationId) {
    return officeLocationId == null
        ? null
        : officeLocationRepository
            .findById(officeLocationId)
            .filter(OfficeLocation::isActive)
            .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Office location not found"));
  }

  private Department resolveDepartment(Long departmentId) {
    return departmentId == null
        ? null
        : departmentRepository
            .findById(departmentId)
            .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Department not found"));
  }

  private WorkShift resolveShift(Long shiftId) {
    return shiftId == null
        ? null
        : workShiftRepository
            .findById(shiftId)
            .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Shift not found"));
  }
}
