package com.attendance.api;

import com.attendance.api.dto.AttendanceDtos;
import com.attendance.api.dto.CompOffDtos;
import com.attendance.api.dto.LeaveDtos;
import com.attendance.api.dto.RegularizationDtos;
import com.attendance.api.dto.SummaryDtos;
import com.attendance.api.dto.ViewDtos;
import com.attendance.api.dto.WorkRequestDtos;
import com.attendance.domain.Employee;
import com.attendance.repo.EmployeeRepository;
import com.attendance.service.LeaveRequestService;
import com.attendance.service.RegularizationRequestService;
import com.attendance.service.ReportService;
import com.attendance.service.AnalyticsService;
import com.attendance.service.WorkRequestService;
import com.attendance.service.ProductionFeatureService;
import com.attendance.service.CompOffService;
import com.attendance.service.PayrollService;
import com.attendance.api.dto.ProductionDtos;
import com.attendance.service.ApiException;
import com.attendance.service.AttendanceClock;
import com.attendance.service.AttendanceExportService;
import com.attendance.service.AttendanceService;
import jakarta.validation.Valid;
import org.springframework.transaction.annotation.Transactional;
import java.time.YearMonth;
import java.util.List;
import java.util.Map;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/hr")
@PreAuthorize("hasAnyAuthority('ROLE_HR','ROLE_ADMIN')")
public class HrController {
  private final EmployeeRepository employeeRepository;
  private final AttendanceService attendanceService;
  private final LeaveRequestService leaveRequestService;
  private final AttendanceExportService attendanceExportService;
  private final RegularizationRequestService regularizationRequestService;
  private final ReportService reportService;
  private final AnalyticsService analyticsService;
  private final WorkRequestService workRequestService;
  private final ProductionFeatureService productionFeatureService;
  private final CompOffService compOffService;
  private final PayrollService payrollService;
  private final com.attendance.service.PayrollLockService payrollLockService;

  public HrController(
      EmployeeRepository employeeRepository,
      AttendanceService attendanceService,
      LeaveRequestService leaveRequestService,
      AttendanceExportService attendanceExportService,
      RegularizationRequestService regularizationRequestService,
      ReportService reportService,
      AnalyticsService analyticsService,
      WorkRequestService workRequestService,
      ProductionFeatureService productionFeatureService,
      CompOffService compOffService,
      PayrollService payrollService,
      com.attendance.service.PayrollLockService payrollLockService) {
    this.employeeRepository = employeeRepository;
    this.attendanceService = attendanceService;
    this.leaveRequestService = leaveRequestService;
    this.attendanceExportService = attendanceExportService;
    this.regularizationRequestService = regularizationRequestService;
    this.reportService = reportService;
    this.analyticsService = analyticsService;
    this.workRequestService = workRequestService;
    this.productionFeatureService = productionFeatureService;
    this.compOffService = compOffService;
    this.payrollService = payrollService;
    this.payrollLockService = payrollLockService;
  }

  @GetMapping("/employees")
  public List<ViewDtos.EmployeeView> listEmployees() {
    return employeeRepository.findAll().stream().map(this::toEmployeeView).toList();
  }

  @GetMapping("/analytics")
  public Map<String, Object> analytics(@RequestParam("month") String month) {
    return analyticsService.month(YearMonth.parse(month));
  }

  @GetMapping("/payroll-lock")
  public Map<String, Object> payrollLock(@RequestParam("month") String month) {
    return payrollLockService.view(YearMonth.parse(month));
  }

  @PostMapping("/payroll-lock")
  public Map<String, Object> setPayrollLock(@RequestParam("month") String month, @RequestParam("locked") boolean locked) {
    String username = (String) SecurityContextHolder.getContext().getAuthentication().getPrincipal();
    payrollLockService.setLocked(YearMonth.parse(month), locked, username);
    return payrollLockService.view(YearMonth.parse(month));
  }

  @GetMapping("/payroll/export")
  public ResponseEntity<String> payrollExport(@RequestParam("month") String month) {
    YearMonth ym = YearMonth.parse(month);
    return ResponseEntity.ok()
        .contentType(new MediaType("text", "csv"))
        .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"payroll-" + ym + ".csv\"")
        .body(payrollService.monthlyRegisterCsv(ym));
  }
  @GetMapping("/payroll")
  public List<Map<String, Object>> payroll(@RequestParam("month") String month) {
    return payrollService.monthlyRegister(YearMonth.parse(month));
  }

  @GetMapping("/employees/{id}/leave-balances")
  public List<Map<String, Object>> leaveBalances(@PathVariable("id") Long id, @RequestParam(value = "year", required = false) Integer year) {
    return productionFeatureService.balanceViews(id, year == null ? AttendanceClock.today().getYear() : year);
  }

  @PostMapping("/leave-balances")
  public Map<String, Object> setLeaveBalance(@RequestBody ProductionDtos.BalanceRequest req) {
    return ProductionFeatureService.balanceView(productionFeatureService.setBalance(req.getEmployeeId(), req.getLeaveType(), req.getYear(), req.getAllocatedDays(), req.getUsedDays()));
  }

  @PostMapping("/attendance")
  public AttendanceDtos.AttendanceResponse upsert(@Valid @RequestBody AttendanceDtos.UpsertAttendanceRequest req) {
    var e =
        attendanceService.upsert(
            req.getEmployeeId(),
            req.getDate(),
            req.getInTime(),
            req.getOutTime(),
            req.getLeaveReason(),
            true);
    return new AttendanceDtos.AttendanceResponse(
        e.getId(),
        e.getEmployee().getId(),
        e.getDate(),
        e.getInTime(),
        e.getOutTime(),
        e.getWorkedMinutes(),
        e.getLateMinutes(),
        e.getEarlyLeaveMinutes(),
        e.getOvertimeMinutes(),
        e.getLeaveReason(),
        e.getCheckInLatitude(),
        e.getCheckInLongitude(),
        e.getCheckInPhotoUrl(),
        e.getCheckInFaceScore(),
        e.getCheckInFaceVerified(),
        e.getCheckOutLatitude(),
        e.getCheckOutLongitude(),
        e.getCheckOutPhotoUrl(),
        e.getCheckOutFaceScore(),
        e.getCheckOutFaceVerified(),
        e.getStatus());
  }

  @PostMapping("/attendance/range")
  public Map<String, Object> upsertRange(
      @Valid @RequestBody AttendanceDtos.UpsertAttendanceRangeRequest req) {
    var fromDate = req.getFromDate();
    var toDate = req.getToDate();
    var startDate = attendanceService.attendanceStartDate(req.getEmployeeId());
    if (fromDate.isBefore(startDate)) {
      fromDate = startDate;
    }

    if (fromDate.isAfter(toDate)) {
      throw new ApiException(HttpStatus.BAD_REQUEST, "fromDate must be <= toDate");
    }
    long days = java.time.temporal.ChronoUnit.DAYS.between(fromDate, toDate) + 1;
    if (days > 400) {
      throw new ApiException(HttpStatus.BAD_REQUEST, "Range too large (max 400 days)");
    }
    int updated = 0;
    for (var d = fromDate; !d.isAfter(toDate); d = d.plusDays(1)) {
      if (!attendanceService.isWorkingDay(d)) continue;
      attendanceService.upsert(
          req.getEmployeeId(), d, req.getInTime(), req.getOutTime(), req.getLeaveReason(), true);
      updated++;
    }
    return Map.of("updatedDays", updated);
  }

  @GetMapping("/attendance")
  public List<AttendanceDtos.AttendanceResponse> listForMonth(
      @RequestParam("employeeId") Long employeeId, @RequestParam("month") String month) {
    YearMonth ym = YearMonth.parse(month);
    return attendanceService.listForMonth(employeeId, ym).stream()
        .map(
            e ->
                new AttendanceDtos.AttendanceResponse(
                    e.getId(),
                    e.getEmployee().getId(),
                    e.getDate(),
                    e.getInTime(),
                    e.getOutTime(),
                    e.getWorkedMinutes(),
                    e.getLateMinutes(),
                    e.getEarlyLeaveMinutes(),
                    e.getOvertimeMinutes(),
                    e.getLeaveReason(),
                    e.getCheckInLatitude(),
                    e.getCheckInLongitude(),
                    e.getCheckInPhotoUrl(),
                    e.getCheckInFaceScore(),
                    e.getCheckInFaceVerified(),
                    e.getCheckOutLatitude(),
                    e.getCheckOutLongitude(),
                    e.getCheckOutPhotoUrl(),
                    e.getCheckOutFaceScore(),
                    e.getCheckOutFaceVerified(),
                    e.getStatus()))
        .toList();
  }

  @GetMapping("/attendance/summary")
  public SummaryDtos.MonthSummaryResponse summary(
      @RequestParam("employeeId") Long employeeId, @RequestParam("month") String month) {
    YearMonth ym = YearMonth.parse(month);
    var s = attendanceService.monthSummary(employeeId, ym);
    return new SummaryDtos.MonthSummaryResponse(
        ym.toString(),
        s.fromDate(),
        s.toDate(),
        s.workingDays(),
        s.presentDays(),
        s.halfDayDays(),
        s.leaveDays(),
        s.totalWorkedMinutes());
  }

  @GetMapping("/attendance/export")
  public ResponseEntity<String> exportForMonth(
      @RequestParam("employeeId") Long employeeId, @RequestParam("month") String month) {
    YearMonth ym = YearMonth.parse(month);
    Employee employee =
        employeeRepository
            .findById(employeeId)
            .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Employee not found"));
    var entries = attendanceService.listForMonth(employeeId, ym);
    String csv = attendanceExportService.employeeMonthCsv(employee, ym, entries);
    return ResponseEntity.ok()
        .contentType(new MediaType("text", "csv"))
        .header(
            HttpHeaders.CONTENT_DISPOSITION,
            "attachment; filename=\"" + attendanceExportService.filename(employee, ym) + "\"")
        .body(csv);
  }

  @GetMapping("/attendance/report.pdf")
  public ResponseEntity<byte[]> pdfForMonth(
      @RequestParam("employeeId") Long employeeId, @RequestParam("month") String month) {
    YearMonth ym = YearMonth.parse(month);
    Employee employee =
        employeeRepository
            .findById(employeeId)
            .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Employee not found"));
    byte[] pdf = reportService.employeePdf(employee, ym, attendanceService.listForMonth(employeeId, ym));
    return ResponseEntity.ok()
        .contentType(MediaType.APPLICATION_PDF)
        .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"attendance-" + employee.getEmployeeNumber() + "-" + ym + ".pdf\"")
        .body(pdf);
  }

  @GetMapping("/leave-requests/pending")
  @Transactional(readOnly = true)
  public List<LeaveDtos.LeaveRequestResponse> pendingLeaveRequests() {
    return leaveRequestService.listPending().stream().map(HrController::toLeaveResponse).toList();
  }

  @PostMapping("/leave-requests/{id}/approve")
  public LeaveDtos.LeaveRequestResponse approve(@PathVariable("id") Long id, @RequestBody(required = false) LeaveDtos.DecideLeaveRequest req) {
    String username = (String) SecurityContextHolder.getContext().getAuthentication().getPrincipal();
    var saved = leaveRequestService.approve(id, username, req == null ? null : req.getRemarks());
    return toLeaveResponse(saved);
  }

  @PostMapping("/leave-requests/{id}/reject")
  public LeaveDtos.LeaveRequestResponse reject(@PathVariable("id") Long id, @RequestBody(required = false) LeaveDtos.DecideLeaveRequest req) {
    String username = (String) SecurityContextHolder.getContext().getAuthentication().getPrincipal();
    var saved = leaveRequestService.reject(id, username, req == null ? null : req.getRemarks());
    return toLeaveResponse(saved);
  }

  @PostMapping("/leave-requests/{id}/approve-cancellation")
  public LeaveDtos.LeaveRequestResponse approveLeaveCancellation(
      @PathVariable("id") Long id, @RequestBody(required = false) LeaveDtos.DecideLeaveRequest req) {
    String username = (String) SecurityContextHolder.getContext().getAuthentication().getPrincipal();
    return toLeaveResponse(leaveRequestService.approveCancellation(id, username, req == null ? null : req.getRemarks()));
  }

  @PostMapping("/leave-requests/{id}/reject-cancellation")
  public LeaveDtos.LeaveRequestResponse rejectLeaveCancellation(
      @PathVariable("id") Long id, @RequestBody(required = false) LeaveDtos.DecideLeaveRequest req) {
    String username = (String) SecurityContextHolder.getContext().getAuthentication().getPrincipal();
    return toLeaveResponse(leaveRequestService.rejectCancellation(id, username, req == null ? null : req.getRemarks()));
  }

  @GetMapping("/comp-off-requests/pending")
  @Transactional(readOnly = true)
  public List<CompOffDtos.CompOffResponse> pendingCompOffRequests() {
    return compOffService.pending().stream().map(HrController::toCompOffResponse).toList();
  }

  @PostMapping("/comp-off-requests/{id}/approve")
  public CompOffDtos.CompOffResponse approveCompOff(
      @PathVariable("id") Long id, @RequestBody(required = false) CompOffDtos.DecideCompOffRequest req) {
    String username = (String) SecurityContextHolder.getContext().getAuthentication().getPrincipal();
    return toCompOffResponse(compOffService.approve(id, username, req == null ? null : req.getRemarks()));
  }

  @PostMapping("/comp-off-requests/{id}/reject")
  public CompOffDtos.CompOffResponse rejectCompOff(
      @PathVariable("id") Long id, @RequestBody(required = false) CompOffDtos.DecideCompOffRequest req) {
    String username = (String) SecurityContextHolder.getContext().getAuthentication().getPrincipal();
    return toCompOffResponse(compOffService.reject(id, username, req == null ? null : req.getRemarks()));
  }

  @GetMapping("/device-requests/pending")
  @Transactional(readOnly = true)
  public List<Map<String, Object>> pendingDeviceRequests() {
    return productionFeatureService.pendingDevices().stream().map(HrController::toDeviceResponse).toList();
  }

  @PostMapping("/device-requests/{id}/approve")
  public Map<String, Object> approveDeviceRequest(@PathVariable("id") Long id) {
    String username = (String) SecurityContextHolder.getContext().getAuthentication().getPrincipal();
    return toDeviceResponse(productionFeatureService.approveDevice(id, true, username));
  }

  @PostMapping("/device-requests/{id}/reject")
  public Map<String, Object> rejectDeviceRequest(@PathVariable("id") Long id) {
    String username = (String) SecurityContextHolder.getContext().getAuthentication().getPrincipal();
    return toDeviceResponse(productionFeatureService.approveDevice(id, false, username));
  }

  @PostMapping("/exceptions/scan-missing-checkouts")
  public Map<String, Object> scanMissingCheckouts() {
    return productionFeatureService.scanMissingCheckouts();
  }
  @GetMapping("/exceptions")
  @Transactional(readOnly = true)
  public List<Map<String, Object>> exceptions() {
    return productionFeatureService.exceptions().stream().map(HrController::toExceptionResponse).toList();
  }

  @PostMapping("/exceptions/{id}/resolve")
  public Map<String, Object> resolveException(@PathVariable("id") Long id) {
    String username = (String) SecurityContextHolder.getContext().getAuthentication().getPrincipal();
    return toExceptionResponse(productionFeatureService.resolveException(id, username));
  }

  @GetMapping("/regularization-requests/pending")
  @Transactional(readOnly = true)
  public List<RegularizationDtos.RegularizationResponse> pendingRegularizationRequests() {
    return regularizationRequestService.listPending().stream().map(HrController::toRegularizationResponse).toList();
  }

  @PostMapping("/regularization-requests/{id}/approve")
  public RegularizationDtos.RegularizationResponse approveRegularization(
      @PathVariable("id") Long id, @RequestBody(required = false) RegularizationDtos.DecideRegularizationRequest req) {
    String username = (String) SecurityContextHolder.getContext().getAuthentication().getPrincipal();
    var saved = regularizationRequestService.approve(id, username, req == null ? null : req.getRemarks());
    return toRegularizationResponse(saved);
  }

  @PostMapping("/regularization-requests/{id}/reject")
  public RegularizationDtos.RegularizationResponse rejectRegularization(
      @PathVariable("id") Long id, @RequestBody(required = false) RegularizationDtos.DecideRegularizationRequest req) {
    String username = (String) SecurityContextHolder.getContext().getAuthentication().getPrincipal();
    var saved = regularizationRequestService.reject(id, username, req == null ? null : req.getRemarks());
    return toRegularizationResponse(saved);
  }

  @GetMapping("/work-requests/pending")
  @Transactional(readOnly = true)
  public List<WorkRequestDtos.WorkRequestResponse> pendingWorkRequests() {
    return workRequestService.listPendingForHr().stream().map(HrController::toWorkRequestResponse).toList();
  }

  @PostMapping("/work-requests/{id}/approve")
  public WorkRequestDtos.WorkRequestResponse approveWorkRequest(
      @PathVariable("id") Long id, @RequestBody(required = false) WorkRequestDtos.DecideWorkRequest req) {
    String username = (String) SecurityContextHolder.getContext().getAuthentication().getPrincipal();
    return toWorkRequestResponse(workRequestService.approve(id, username, req == null ? null : req.getRemarks()));
  }

  @PostMapping("/work-requests/{id}/reject")
  public WorkRequestDtos.WorkRequestResponse rejectWorkRequest(
      @PathVariable("id") Long id, @RequestBody(required = false) WorkRequestDtos.DecideWorkRequest req) {
    String username = (String) SecurityContextHolder.getContext().getAuthentication().getPrincipal();
    return toWorkRequestResponse(workRequestService.reject(id, username, req == null ? null : req.getRemarks()));
  }

  private ViewDtos.EmployeeView toEmployeeView(Employee e) {
    var r = e.getCompanyRole();
    ViewDtos.CompanyRoleView rv =
        r == null ? null : new ViewDtos.CompanyRoleView(r.getId(), r.getName(), r.getPhotoUrl());
    var loc = AdminOfficeLocationController.toResponse(e.getAssignedOfficeLocation());
    var d = e.getDepartment() == null ? null : new ViewDtos.DepartmentView(e.getDepartment().getId(), e.getDepartment().getName());
    var s = e.getShift() == null ? null : new ViewDtos.ShiftView(e.getShift().getId(), e.getShift().getName(), e.getShift().getInTime(), e.getShift().getOutTime(), e.getShift().isFlexible());
    return new ViewDtos.EmployeeView(
        e.getId(), e.getEmployeeNumber(), e.getName(), "ROLE_EMPLOYEE", rv, loc, d, s, e.getUser().isEnabled(), e.getUser().getLastLoginAt(), e.getUser().getLastLoginIp(), e.getStatus().name(), e.getProfilePhotoUrl(), e.getJoinDate(), e.getExitDate());
  }

  private static LeaveDtos.LeaveRequestResponse toLeaveResponse(com.attendance.domain.LeaveRequest lr) {
    var e = lr.getEmployee();
    var decidedBy = lr.getDecidedBy() == null ? null : lr.getDecidedBy().getUsername();
    return new LeaveDtos.LeaveRequestResponse(
        lr.getId(),
        e.getId(),
        e.getName(),
        e.getEmployeeNumber(),
        lr.getFromDate(),
        lr.getToDate(),
        lr.getReason(),
        lr.getLeaveType(),
        lr.getMailSubject(),
        lr.getMailMessage(),
        lr.getAttachmentUrl(),
        lr.getAttachmentName(),
        lr.getStatus(),
        lr.getCreatedAt(),
        lr.getDecidedAt(),
        decidedBy,
        lr.getHrRemarks());
  }

  private static RegularizationDtos.RegularizationResponse toRegularizationResponse(com.attendance.domain.RegularizationRequest r) {
    var e = r.getEmployee();
    var decidedBy = r.getDecidedBy() == null ? null : r.getDecidedBy().getUsername();
    return new RegularizationDtos.RegularizationResponse(
        r.getId(), e.getId(), e.getName(), e.getEmployeeNumber(), r.getDate(), r.getRequestedInTime(), r.getRequestedOutTime(), r.getReason(), r.getAttachmentUrl(), r.getAttachmentName(), r.getStatus(), r.getCreatedAt(), r.getDecidedAt(), decidedBy, r.getHrRemarks());
  }

  private static WorkRequestDtos.WorkRequestResponse toWorkRequestResponse(com.attendance.domain.WorkRequest r) {
    var e = r.getEmployee();
    var decidedBy = r.getDecidedBy() == null ? null : r.getDecidedBy().getUsername();
    return new WorkRequestDtos.WorkRequestResponse(
        r.getId(), e.getId(), e.getName(), e.getEmployeeNumber(), r.getType(), r.getFromDate(), r.getToDate(), r.getReason(), r.getStatus(), r.getCreatedAt(), r.getDecidedAt(), decidedBy, r.getRemarks(), r.getAttachmentUrl(), r.getAttachmentName());
  }

  private static CompOffDtos.CompOffResponse toCompOffResponse(com.attendance.domain.CompOffRequest r) {
    var e = r.getEmployee();
    var decidedBy = r.getDecidedBy() == null ? null : r.getDecidedBy().getUsername();
    return new CompOffDtos.CompOffResponse(
        r.getId(),
        e.getId(),
        e.getName(),
        e.getEmployeeNumber(),
        r.getOvertimeDate(),
        r.getRequestedDate(),
        r.getOvertimeMinutes(),
        r.getReason(),
        r.getAttachmentUrl(),
        r.getAttachmentName(),
        r.getStatus(),
        r.getCreatedAt(),
        r.getDecidedAt(),
        decidedBy,
        r.getHrRemarks());
  }

  private static Map<String, Object> toDeviceResponse(com.attendance.domain.DeviceRegistration d) {
    Map<String, Object> map = new java.util.LinkedHashMap<>();
    map.put("id", d.getId());
    map.put("username", d.getUser().getUsername());
    map.put("deviceId", d.getDeviceId());
    map.put("label", d.getLabel() == null ? "" : d.getLabel());
    map.put("approved", d.isApproved());
    map.put("createdAt", d.getCreatedAt());
    return map;
  }

  private static Map<String, Object> toExceptionResponse(com.attendance.domain.AttendanceException e) {
    Map<String, Object> map = new java.util.LinkedHashMap<>();
    map.put("id", e.getId());
    map.put("employeeId", e.getEmployee() == null ? null : e.getEmployee().getId());
    map.put("employeeName", e.getEmployee() == null ? "--" : e.getEmployee().getName());
    map.put("employeeNumber", e.getEmployee() == null ? "--" : e.getEmployee().getEmployeeNumber());
    map.put("type", e.getType());
    map.put("message", e.getMessage());
    map.put("resolved", e.isResolved());
    map.put("createdAt", e.getCreatedAt());
    return map;
  }
}


