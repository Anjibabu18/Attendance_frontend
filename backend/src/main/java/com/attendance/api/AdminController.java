package com.attendance.api;

import com.attendance.api.dto.AdminDtos;
import com.attendance.api.dto.AccountDtos;
import com.attendance.api.dto.AuditDtos;
import com.attendance.api.dto.OfficeDtos;
import com.attendance.api.dto.SettingsDtos;
import com.attendance.api.dto.RosterDtos;
import com.attendance.api.dto.ViewDtos;
import com.attendance.domain.Employee;
import com.attendance.repo.EmployeeRepository;
import com.attendance.service.CompanyProfileService;
import com.attendance.service.CompanyRoleService;
import com.attendance.service.AttendanceSettingsService;
import com.attendance.service.AuditLogService;
import com.attendance.service.AnalyticsService;
import com.attendance.service.BulkEmployeeImportService;
import com.attendance.service.OrgSetupService;
import com.attendance.service.ProductionChecklistService;
import com.attendance.service.UserService;
import com.attendance.service.RosterService;
import jakarta.validation.Valid;
import java.util.List;
import java.util.Map;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/api/admin")
@PreAuthorize("hasAuthority('ROLE_ADMIN')")
public class AdminController {
  private final UserService userService;
  private final CompanyRoleService companyRoleService;
  private final AttendanceSettingsService attendanceSettingsService;
  private final CompanyProfileService companyProfileService;
  private final EmployeeRepository employeeRepository;
  private final AuditLogService auditLogService;
  private final OrgSetupService orgSetupService;
  private final ProductionChecklistService productionChecklistService;
  private final BulkEmployeeImportService bulkEmployeeImportService;
  private final AnalyticsService analyticsService;
  private final RosterService rosterService;

  public AdminController(
      UserService userService,
      CompanyRoleService companyRoleService,
      AttendanceSettingsService attendanceSettingsService,
      CompanyProfileService companyProfileService,
      EmployeeRepository employeeRepository,
      AuditLogService auditLogService,
      OrgSetupService orgSetupService,
      ProductionChecklistService productionChecklistService,
      BulkEmployeeImportService bulkEmployeeImportService,
      AnalyticsService analyticsService,
      RosterService rosterService) {
    this.userService = userService;
    this.companyRoleService = companyRoleService;
    this.attendanceSettingsService = attendanceSettingsService;
    this.companyProfileService = companyProfileService;
    this.employeeRepository = employeeRepository;
    this.auditLogService = auditLogService;
    this.orgSetupService = orgSetupService;
    this.productionChecklistService = productionChecklistService;
    this.bulkEmployeeImportService = bulkEmployeeImportService;
    this.analyticsService = analyticsService;
    this.rosterService = rosterService;
  }

  @PostMapping("/hr")
  public Object createHr(@Valid @RequestBody AdminDtos.CreateHrRequest req) {
    var hr = userService.createHr(req.getUsername(), req.getPassword());
    return java.util.Map.of("id", hr.getId(), "username", hr.getUsername(), "role", hr.getRole());
  }

  @PostMapping("/manager")
  public Object createManager(@Valid @RequestBody AdminDtos.CreateHrRequest req) {
    var manager = userService.createManager(req.getUsername(), req.getPassword());
    return java.util.Map.of("id", manager.getId(), "username", manager.getUsername(), "role", manager.getRole());
  }

  @PostMapping("/company-roles")
  public ViewDtos.CompanyRoleView createCompanyRole(
      @Valid @RequestBody AdminDtos.CreateCompanyRoleRequest req) {
    var r = companyRoleService.createRole(req.getName());
    return new ViewDtos.CompanyRoleView(r.getId(), r.getName(), r.getPhotoUrl());
  }

  @GetMapping("/company-roles")
  public List<ViewDtos.CompanyRoleView> listCompanyRoles() {
    return companyRoleService.listRoles().stream()
        .map(r -> new ViewDtos.CompanyRoleView(r.getId(), r.getName(), r.getPhotoUrl()))
        .toList();
  }

  @PostMapping("/company-roles/{id}/photo")
  public ViewDtos.CompanyRoleView uploadCompanyRolePhoto(
      @PathVariable("id") Long id, @RequestParam("file") MultipartFile file) {
    var r = companyRoleService.uploadRolePhoto(id, file);
    return new ViewDtos.CompanyRoleView(r.getId(), r.getName(), r.getPhotoUrl());
  }

  @PostMapping("/company/photo")
  public java.util.Map<String, Object> uploadCompanyGroupPhoto(@RequestParam("file") MultipartFile file) {
    var p = companyProfileService.uploadGroupPhoto(file);
    return java.util.Map.of("groupPhotoUrl", p.getGroupPhotoUrl());
  }

  @PostMapping("/employees")
  public ViewDtos.EmployeeView createEmployee(@Valid @RequestBody AdminDtos.CreateEmployeeRequest req) {
    var e =
        userService.createEmployee(
            req.getEmployeeNumber(),
            req.getName(),
            req.getUsername(),
            req.getPassword(),
            req.getCompanyRoleId(),
            req.getOfficeLocationId(),
            req.getDepartmentId(),
            req.getShiftId(),
            req.getJoinDate());
    return toEmployeeView(e);
  }

  @PostMapping("/employees/{id}/office-location")
  public ViewDtos.EmployeeView assignOfficeLocation(
      @PathVariable("id") Long id, @RequestBody OfficeDtos.AssignEmployeeOfficeRequest req) {
    return toEmployeeView(userService.assignOfficeLocation(id, req.getOfficeLocationId()));
  }

  @PostMapping("/employees/{id}")
  public ViewDtos.EmployeeView updateEmployee(
      @PathVariable("id") Long id, @Valid @RequestBody AdminDtos.UpdateEmployeeRequest req) {
    return toEmployeeView(
        userService.updateEmployee(
            id,
            req.getEmployeeNumber(),
            req.getName(),
            req.getCompanyRoleId(),
            req.getOfficeLocationId(),
            req.getDepartmentId(),
            req.getShiftId(),
            req.getJoinDate()));
  }

  @PostMapping("/employees/{id}/enabled")
  public ViewDtos.EmployeeView setEmployeeEnabled(
      @PathVariable("id") Long id, @RequestBody Map<String, Boolean> req) {
    String actor = (String) SecurityContextHolder.getContext().getAuthentication().getPrincipal();
    return toEmployeeView(userService.setEmployeeEnabled(id, Boolean.TRUE.equals(req.get("enabled")), actor));
  }

  @PostMapping("/employees/{id}/status")
  public ViewDtos.EmployeeView setEmployeeStatus(
      @PathVariable("id") Long id, @Valid @RequestBody AdminDtos.SetEmployeeStatusRequest req) {
    String actor = (String) SecurityContextHolder.getContext().getAuthentication().getPrincipal();
    return toEmployeeView(userService.setEmployeeStatus(id, req.getStatus(), req.getExitDate(), actor));
  }

  @PostMapping("/employees/{id}/username")
  public ViewDtos.EmployeeView updateEmployeeUsername(
      @PathVariable("id") Long id, @Valid @RequestBody AdminDtos.UpdateEmployeeUsernameRequest req) {
    String actor = (String) SecurityContextHolder.getContext().getAuthentication().getPrincipal();
    return toEmployeeView(userService.updateEmployeeUsername(id, req.getUsername(), actor));
  }

  @PostMapping("/employees/{id}/password")
  public java.util.Map<String, Object> resetEmployeePassword(
      @PathVariable("id") Long id, @Valid @RequestBody AccountDtos.ResetPasswordRequest req) {
    var employee =
        employeeRepository
            .findById(id)
            .orElseThrow(() -> new com.attendance.service.ApiException(org.springframework.http.HttpStatus.NOT_FOUND, "Employee not found"));
    String actor = (String) SecurityContextHolder.getContext().getAuthentication().getPrincipal();
    userService.resetPassword(employee.getUser().getId(), req.getNewPassword(), actor);
    return java.util.Map.of("ok", true);
  }

  @PostMapping("/employees/passwords/bulk-reset")
  public Map<String, Object> bulkResetEmployeePasswords(@Valid @RequestBody AdminDtos.BulkPasswordResetRequest req) {
    String actor = (String) SecurityContextHolder.getContext().getAuthentication().getPrincipal();
    return Map.of("updated", userService.resetEmployeePasswords(req.getEmployeeIds(), req.getNewPassword(), actor));
  }

  @PostMapping("/employees/bulk-edit")
  public Map<String, Object> bulkEditEmployees(@Valid @RequestBody AdminDtos.BulkEmployeeEditRequest req) {
    String actor = (String) SecurityContextHolder.getContext().getAuthentication().getPrincipal();
    return Map.of("updated", userService.bulkEditEmployees(req.getEmployeeIds(), req.getOfficeLocationId(), req.getDepartmentId(), req.getShiftId(), req.getStatus(), req.getNewPassword(), actor));
  }

  @PostMapping("/roster")
  public Map<String, Object> assignRoster(@Valid @RequestBody RosterDtos.AssignShiftRequest req) {
    return Map.of("assignedDays", rosterService.assign(req.getEmployeeId(), req.getShiftId(), req.getFromDate(), req.getToDate()));
  }

  @GetMapping("/roster")
  public List<Map<String, Object>> roster(@RequestParam("from") java.time.LocalDate from, @RequestParam("to") java.time.LocalDate to) {
    return rosterService.list(from, to).stream().map(r -> Map.<String, Object>of(
        "id", r.getId(),
        "date", r.getDate(),
        "employeeId", r.getEmployee().getId(),
        "employeeName", r.getEmployee().getName(),
        "employeeNumber", r.getEmployee().getEmployeeNumber(),
        "shiftId", r.getShift().getId(),
        "shiftName", r.getShift().getName(),
        "inTime", r.getShift().getInTime(),
        "outTime", r.getShift().getOutTime())).toList();
  }

  @GetMapping("/backup/employees.csv")
  public ResponseEntity<String> employeeBackupCsv() {
    StringBuilder sb = new StringBuilder("Employee No,Name,Username,Status,Enabled,Department,Shift,Office,Join Date,Exit Date,Last Login\n");
    for (Employee e : employeeRepository.findAll()) {
      sb.append(csv(e.getEmployeeNumber())).append(',')
          .append(csv(e.getName())).append(',')
          .append(csv(e.getUser().getUsername())).append(',')
          .append(e.getStatus()).append(',')
          .append(e.getUser().isEnabled()).append(',')
          .append(csv(e.getDepartment() == null ? "" : e.getDepartment().getName())).append(',')
          .append(csv(e.getShift() == null ? "" : e.getShift().getName())).append(',')
          .append(csv(e.getAssignedOfficeLocation() == null ? "" : e.getAssignedOfficeLocation().getOfficeName())).append(',')
          .append(e.getJoinDate() == null ? "" : e.getJoinDate()).append(',')
          .append(e.getExitDate() == null ? "" : e.getExitDate()).append(',')
          .append(e.getUser().getLastLoginAt() == null ? "" : e.getUser().getLastLoginAt())
          .append('\n');
    }
    return ResponseEntity.ok()
        .contentType(new MediaType("text", "csv"))
        .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"attendance-employees-backup.csv\"")
        .body(sb.toString());
  }

  @GetMapping("/audit-logs")
  public List<AuditDtos.AuditLogResponse> auditLogs(
      @RequestParam(value = "actor", required = false) String actor,
      @RequestParam(value = "action", required = false) String action,
      @RequestParam(value = "targetType", required = false) String targetType,
      @RequestParam(value = "targetId", required = false) String targetId,
      @RequestParam(value = "from", required = false) java.time.LocalDate from,
      @RequestParam(value = "to", required = false) java.time.LocalDate to) {
    return auditLogService.search(actor, action, targetType, targetId, from, to).stream()
        .map(l -> new AuditDtos.AuditLogResponse(l.getId(), l.getActorUsername(), l.getAction(), l.getTargetType(), l.getTargetId(), l.getDetails(), l.getCreatedAt()))
        .toList();
  }

  @GetMapping("/employees")
  public List<ViewDtos.EmployeeView> listEmployees() {
    return employeeRepository.findAll().stream().map(this::toEmployeeView).toList();
  }

  @PostMapping("/departments")
  public ViewDtos.DepartmentView createDepartment(@Valid @RequestBody AdminDtos.CreateDepartmentRequest req) {
    var d = orgSetupService.createDepartment(req.getName());
    return new ViewDtos.DepartmentView(d.getId(), d.getName());
  }

  @GetMapping("/departments")
  public List<ViewDtos.DepartmentView> listDepartments() {
    return orgSetupService.departments().stream().map(d -> new ViewDtos.DepartmentView(d.getId(), d.getName())).toList();
  }

  @PostMapping("/shifts")
  public ViewDtos.ShiftView createShift(@Valid @RequestBody AdminDtos.CreateShiftRequest req) {
    var s = orgSetupService.createShift(req.getName(), req.getInTime(), req.getOutTime(), req.isFlexible());
    return new ViewDtos.ShiftView(s.getId(), s.getName(), s.getInTime(), s.getOutTime(), s.isFlexible());
  }

  @GetMapping("/shifts")
  public List<ViewDtos.ShiftView> listShifts() {
    return orgSetupService.shifts().stream().map(s -> new ViewDtos.ShiftView(s.getId(), s.getName(), s.getInTime(), s.getOutTime(), s.isFlexible())).toList();
  }

  @GetMapping("/production-checklist")
  public Map<String, Object> productionChecklist() {
    return productionChecklistService.status();
  }

  @PostMapping("/employees/import")
  public Map<String, Object> importEmployees(@RequestParam("file") MultipartFile file) {
    return Map.of("created", bulkEmployeeImportService.importCsv(file));
  }

  @GetMapping("/analytics")
  public Map<String, Object> analytics(@RequestParam("month") String month) {
    return analyticsService.month(java.time.YearMonth.parse(month));
  }

  @GetMapping("/settings/attendance")
  public SettingsDtos.AttendanceSettingsResponse getAttendanceSettings() {
    var s = attendanceSettingsService.get();
    return new SettingsDtos.AttendanceSettingsResponse(
        s.getDefaultInTime(),
        s.getDefaultOutTime(),
        s.getWeekendDays(),
        s.getFullDayMinutes(),
        s.getHalfDayMinutes(),
        s.getLateGraceMinutes(),
        s.getEarlyLeaveGraceMinutes(),
        s.getOvertimeAfterMinutes(),
        s.getLateDeductionPerMinute(),
        s.getOvertimePayPerHour(),
        s.getUnpaidLeaveDailyRate(),
        s.getStandardMonthlySalary(),
        s.getRequireQrForPunch(),
        s.getPermanentOfficeQr(),
        s.getQrTokenValidityMinutes());
  }

  @PostMapping("/settings/attendance")
  public SettingsDtos.AttendanceSettingsResponse updateAttendanceSettings(
      @Valid @RequestBody SettingsDtos.UpdateAttendanceSettingsRequest req) {
    var s =
        attendanceSettingsService.update(
            req.getDefaultInTime(),
            req.getDefaultOutTime(),
            req.getWeekendDays(),
            req.getFullDayMinutes(),
            req.getHalfDayMinutes(),
            req.getLateGraceMinutes(),
            req.getEarlyLeaveGraceMinutes(),
          req.getOvertimeAfterMinutes(),
          req.getLateDeductionPerMinute(),
          req.getOvertimePayPerHour(),
          req.getUnpaidLeaveDailyRate(),
          req.getStandardMonthlySalary(),
          req.getRequireQrForPunch(),
          req.getPermanentOfficeQr(),
          req.getQrTokenValidityMinutes());
    return new SettingsDtos.AttendanceSettingsResponse(
        s.getDefaultInTime(),
        s.getDefaultOutTime(),
        s.getWeekendDays(),
        s.getFullDayMinutes(),
        s.getHalfDayMinutes(),
        s.getLateGraceMinutes(),
        s.getEarlyLeaveGraceMinutes(),
        s.getOvertimeAfterMinutes(),
        s.getLateDeductionPerMinute(),
        s.getOvertimePayPerHour(),
        s.getUnpaidLeaveDailyRate(),
        s.getStandardMonthlySalary(),
        s.getRequireQrForPunch(),
        s.getPermanentOfficeQr(),
        s.getQrTokenValidityMinutes());
  }

  private ViewDtos.EmployeeView toEmployeeView(Employee e) {
    var r = e.getCompanyRole();
    ViewDtos.CompanyRoleView rv =
        r == null ? null : new ViewDtos.CompanyRoleView(r.getId(), r.getName(), r.getPhotoUrl());
    var loc = AdminOfficeLocationController.toResponse(e.getAssignedOfficeLocation());
    var d = e.getDepartment() == null ? null : new ViewDtos.DepartmentView(e.getDepartment().getId(), e.getDepartment().getName());
    var s = e.getShift() == null ? null : new ViewDtos.ShiftView(e.getShift().getId(), e.getShift().getName(), e.getShift().getInTime(), e.getShift().getOutTime(), e.getShift().isFlexible());
    ViewDtos.EmployeeView view = new ViewDtos.EmployeeView(
        e.getId(), e.getEmployeeNumber(), e.getName(), "ROLE_EMPLOYEE", rv, loc, d, s, e.getUser().isEnabled(), e.getUser().getLastLoginAt(), e.getUser().getLastLoginIp(), e.getStatus().name(), e.getProfilePhotoUrl(), e.getJoinDate(), e.getExitDate());
    view.setUsername(e.getUser().getUsername());
    return view;
  }

  private static String csv(String value) {
    String v = value == null ? "" : value;
    if (v.contains(",") || v.contains("\"") || v.contains("\n")) {
      return "\"" + v.replace("\"", "\"\"") + "\"";
    }
    return v;
  }
}
