package com.attendance.api;

import com.attendance.api.dto.AttendanceDtos;
import com.attendance.api.dto.BreakDtos;
import com.attendance.api.dto.LeaveDtos;
import com.attendance.api.dto.RegularizationDtos;
import com.attendance.api.dto.SummaryDtos;
import com.attendance.api.dto.ViewDtos;
import com.attendance.api.dto.WorkRequestDtos;
import com.attendance.api.dto.CompOffDtos;
import com.attendance.domain.AppUser;
import com.attendance.domain.Role;
import com.attendance.repo.EmployeeRepository;
import com.attendance.repo.ShiftRosterAssignmentRepository;
import com.attendance.repo.UserRepository;
import com.attendance.service.ApiException;
import com.attendance.service.AttendanceClock;
import com.attendance.service.AttendanceExportService;
import com.attendance.service.AttendanceBreakService;
import com.attendance.service.AttendanceService;
import com.attendance.service.LeaveRequestService;
import com.attendance.service.CloudinaryService;
import com.attendance.service.ReportService;
import com.attendance.service.RegularizationRequestService;
import com.attendance.service.WorkRequestService;
import com.attendance.service.ProductionFeatureService;
import com.attendance.service.CompOffService;
import com.attendance.service.FaceVerificationService;
import com.attendance.service.PayrollService;
import jakarta.validation.Valid;
import java.time.YearMonth;
import java.time.LocalDate;
import java.util.List;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/api/employee")
@PreAuthorize("hasAuthority('ROLE_EMPLOYEE')")
public class EmployeeController {
  private final UserRepository userRepository;
  private final EmployeeRepository employeeRepository;
  private final ShiftRosterAssignmentRepository shiftRosterAssignmentRepository;
  private final AttendanceService attendanceService;
  private final LeaveRequestService leaveRequestService;
  private final AttendanceExportService attendanceExportService;
  private final RegularizationRequestService regularizationRequestService;
  private final AttendanceBreakService attendanceBreakService;
  private final ReportService reportService;
  private final WorkRequestService workRequestService;
  private final ProductionFeatureService productionFeatureService;
  private final CompOffService compOffService;
  private final CloudinaryService cloudinaryService;
  private final PayrollService payrollService;
  private final FaceVerificationService faceVerificationService;

  public EmployeeController(
      UserRepository userRepository,
      EmployeeRepository employeeRepository,
      ShiftRosterAssignmentRepository shiftRosterAssignmentRepository,
      AttendanceService attendanceService,
      LeaveRequestService leaveRequestService,
      AttendanceExportService attendanceExportService,
      RegularizationRequestService regularizationRequestService,
      AttendanceBreakService attendanceBreakService,
      ReportService reportService,
      WorkRequestService workRequestService,
      ProductionFeatureService productionFeatureService,
      CompOffService compOffService,
      CloudinaryService cloudinaryService,
      PayrollService payrollService,
      FaceVerificationService faceVerificationService) {
    this.userRepository = userRepository;
    this.employeeRepository = employeeRepository;
    this.shiftRosterAssignmentRepository = shiftRosterAssignmentRepository;
    this.attendanceService = attendanceService;
    this.leaveRequestService = leaveRequestService;
    this.attendanceExportService = attendanceExportService;
    this.regularizationRequestService = regularizationRequestService;
    this.attendanceBreakService = attendanceBreakService;
    this.reportService = reportService;
    this.workRequestService = workRequestService;
    this.productionFeatureService = productionFeatureService;
    this.compOffService = compOffService;
    this.cloudinaryService = cloudinaryService;
    this.payrollService = payrollService;
    this.faceVerificationService = faceVerificationService;
  }

  @GetMapping("/profile")
  @Transactional(readOnly = true)
  public ViewDtos.EmployeeProfileView profile() {
    var emp = currentEmployee();
    var r = emp.getCompanyRole();
    ViewDtos.CompanyRoleView rv =
        r == null ? null : new ViewDtos.CompanyRoleView(r.getId(), r.getName(), r.getPhotoUrl());
    var loc = AdminOfficeLocationController.toResponse(emp.getAssignedOfficeLocation());
    var d = emp.getDepartment() == null ? null : new ViewDtos.DepartmentView(emp.getDepartment().getId(), emp.getDepartment().getName());
    var effectiveShift =
        shiftRosterAssignmentRepository
            .findByEmployee_IdAndDate(emp.getId(), AttendanceClock.today())
            .map(com.attendance.domain.ShiftRosterAssignment::getShift)
            .orElse(emp.getShift());
    var s = effectiveShift == null ? null : new ViewDtos.ShiftView(effectiveShift.getId(), effectiveShift.getName(), effectiveShift.getInTime(), effectiveShift.getOutTime(), effectiveShift.isFlexible());
    return new ViewDtos.EmployeeProfileView(
        emp.getId(), emp.getEmployeeNumber(), emp.getName(), rv, loc, d, s, emp.getStatus().name(), emp.getProfilePhotoUrl());
  }

  @PostMapping("/profile/photo")
  @Transactional
  public ViewDtos.EmployeeProfileView uploadProfilePhoto(@RequestParam("file") MultipartFile file) {
    var emp = currentEmployee();
    var detection = faceVerificationService.detectFace(file);
    if (!detection.faceDetected()) {
      throw new ApiException(HttpStatus.BAD_REQUEST, detection.message());
    }
    if (detection.faceCount() != 1) {
      throw new ApiException(HttpStatus.BAD_REQUEST, "Use one clear face only for the reference photo");
    }
    var upload =
        cloudinaryService.uploadGroupPhoto(file, "employee-profile-" + emp.getId());
    emp.setProfilePhotoUrl(upload.url());
    emp.setProfilePhotoPublicId(upload.publicId());
    employeeRepository.save(emp);
    return profile();
  }

  @GetMapping("/attendance")
  public List<AttendanceDtos.AttendanceResponse> listForMonth(@RequestParam("month") String month) {
    var emp = currentEmployee();
    YearMonth ym = YearMonth.parse(month);
    return attendanceService.listForMonth(emp.getId(), ym).stream()
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
  public SummaryDtos.MonthSummaryResponse summary(@RequestParam("month") String month) {
    var emp = currentEmployee();
    YearMonth ym = YearMonth.parse(month);
    var s = attendanceService.monthSummary(emp.getId(), ym);
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
  public ResponseEntity<String> exportForMonth(@RequestParam("month") String month) {
    var emp = currentEmployee();
    YearMonth ym = YearMonth.parse(month);
    var entries = attendanceService.listForMonth(emp.getId(), ym);
    String csv = attendanceExportService.employeeMonthCsv(emp, ym, entries);
    return ResponseEntity.ok()
        .contentType(new MediaType("text", "csv"))
        .header(
            HttpHeaders.CONTENT_DISPOSITION,
            "attachment; filename=\"" + attendanceExportService.filename(emp, ym) + "\"")
        .body(csv);
  }

  @GetMapping("/attendance/report.pdf")
  public ResponseEntity<byte[]> pdfForMonth(@RequestParam("month") String month) {
    var emp = currentEmployee();
    YearMonth ym = YearMonth.parse(month);
    byte[] pdf = reportService.employeePdf(emp, ym, attendanceService.listForMonth(emp.getId(), ym));
    return ResponseEntity.ok()
        .contentType(MediaType.APPLICATION_PDF)
        .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"attendance-" + emp.getEmployeeNumber() + "-" + ym + ".pdf\"")
        .body(pdf);
  }

  @GetMapping("/attendance/payslip")
  public java.util.Map<String, Object> payslip(@RequestParam("month") String month) {
    return payrollService.employeePayslip(currentEmployee().getId(), YearMonth.parse(month));
  }

  @GetMapping("/breaks/today")
  public List<BreakDtos.BreakResponse> todayBreaks() {
    var emp = currentEmployee();
    return attendanceBreakService.today(emp).stream().map(b -> new BreakDtos.BreakResponse(b.getId(), b.getBreakStart(), b.getBreakEnd())).toList();
  }

  @PostMapping("/breaks/start")
  public BreakDtos.BreakResponse startBreak() {
    var b = attendanceBreakService.start(currentEmployee());
    return new BreakDtos.BreakResponse(b.getId(), b.getBreakStart(), b.getBreakEnd());
  }

  @PostMapping("/breaks/end")
  public BreakDtos.BreakResponse endBreak() {
    var b = attendanceBreakService.end(currentEmployee());
    return new BreakDtos.BreakResponse(b.getId(), b.getBreakStart(), b.getBreakEnd());
  }

  @GetMapping("/leave-requests")
  @org.springframework.transaction.annotation.Transactional(readOnly = true)
  public List<LeaveDtos.LeaveRequestResponse> listLeaveRequests() {
    var emp = currentEmployee();
    return leaveRequestService.listForEmployee(emp).stream().map(EmployeeController::toLeaveResponse).toList();
  }

  @GetMapping("/leave-balances")
  public java.util.List<java.util.Map<String, Object>> leaveBalances(@RequestParam(value = "year", required = false) Integer year) {
    var emp = currentEmployee();
    return productionFeatureService.balanceViews(emp.getId(), year == null ? AttendanceClock.today().getYear() : year);
  }

  @PostMapping("/leave-requests")
  public LeaveDtos.LeaveRequestResponse createLeaveRequest(@Valid @RequestBody LeaveDtos.CreateLeaveRequest req) {
    var emp = currentEmployee();
    var lr =
        leaveRequestService.create(
            emp,
            req.getFromDate(),
            req.getToDate(),
            req.getReason(),
            req.getLeaveType(),
            req.getMailSubject(),
            req.getMailMessage());
    return toLeaveResponse(lr);
  }

  @PostMapping("/leave-requests/{id}/cancel")
  public LeaveDtos.LeaveRequestResponse cancelLeaveRequest(@PathVariable("id") Long id, @RequestBody(required = false) java.util.Map<String, String> req) {
    var saved = leaveRequestService.cancelOrRequestCancellation(id, currentEmployee(), req == null ? null : req.get("reason"));
    return toLeaveResponse(saved);
  }

  @PostMapping("/leave-requests/{id}/attachment")
  public LeaveDtos.LeaveRequestResponse uploadLeaveAttachment(
      @PathVariable("id") Long id, @RequestParam("file") MultipartFile file) {
    return toLeaveResponse(leaveRequestService.attachDocument(id, currentEmployee(), file));
  }

  @GetMapping("/regularization-requests")
  @org.springframework.transaction.annotation.Transactional(readOnly = true)
  public List<RegularizationDtos.RegularizationResponse> listRegularizationRequests() {
    var emp = currentEmployee();
    return regularizationRequestService.listForEmployee(emp).stream().map(EmployeeController::toRegularizationResponse).toList();
  }

  @PostMapping("/regularization-requests")
  public RegularizationDtos.RegularizationResponse createRegularizationRequest(
      @Valid @RequestBody RegularizationDtos.CreateRegularizationRequest req) {
    var emp = currentEmployee();
    var saved = regularizationRequestService.create(emp, req.getDate(), req.getInTime(), req.getOutTime(), req.getReason());
    return toRegularizationResponse(saved);
  }

  @PostMapping("/regularization-requests/{id}/attachment")
  public RegularizationDtos.RegularizationResponse uploadRegularizationAttachment(
      @PathVariable("id") Long id, @RequestParam("file") MultipartFile file) {
    return toRegularizationResponse(regularizationRequestService.attachDocument(id, currentEmployee(), file));
  }

  @GetMapping("/work-requests")
  @org.springframework.transaction.annotation.Transactional(readOnly = true)
  public List<WorkRequestDtos.WorkRequestResponse> listWorkRequests() {
    return workRequestService.listForEmployee(currentEmployee()).stream().map(EmployeeController::toWorkRequestResponse).toList();
  }

  @PostMapping("/work-requests")
  public WorkRequestDtos.WorkRequestResponse createWorkRequest(@Valid @RequestBody WorkRequestDtos.CreateWorkRequest req) {
    var saved = workRequestService.create(currentEmployee(), req.getType(), req.getFromDate(), req.getToDate(), req.getReason());
    return toWorkRequestResponse(saved);
  }

  @PostMapping("/work-requests/{id}/attachment")
  public WorkRequestDtos.WorkRequestResponse uploadWorkAttachment(
      @PathVariable("id") Long id, @RequestParam("file") MultipartFile file) {
    return toWorkRequestResponse(workRequestService.attachDocument(id, currentEmployee(), file));
  }

  @GetMapping("/comp-off-requests")
  @org.springframework.transaction.annotation.Transactional(readOnly = true)
  public List<CompOffDtos.CompOffResponse> listCompOffRequests() {
    return compOffService.listForEmployee(currentEmployee()).stream().map(EmployeeController::toCompOffResponse).toList();
  }

  @PostMapping("/comp-off-requests")
  public CompOffDtos.CompOffResponse createCompOffRequest(@Valid @RequestBody CompOffDtos.CreateCompOffRequest req) {
    var saved = compOffService.create(currentEmployee(), req.getOvertimeDate(), req.getRequestedDate(), req.getOvertimeMinutes(), req.getReason());
    return toCompOffResponse(saved);
  }

  @PostMapping("/comp-off-requests/{id}/attachment")
  public CompOffDtos.CompOffResponse uploadCompOffAttachment(
      @PathVariable("id") Long id, @RequestParam("file") MultipartFile file) {
    return toCompOffResponse(compOffService.attachDocument(id, currentEmployee(), file));
  }

  private com.attendance.domain.Employee currentEmployee() {
    String username = (String) SecurityContextHolder.getContext().getAuthentication().getPrincipal();
    AppUser user =
        userRepository
            .findByUsername(username)
            .orElseThrow(() -> new ApiException(HttpStatus.UNAUTHORIZED, "Invalid token"));
    if (user.getRole() != Role.ROLE_EMPLOYEE) {
      throw new ApiException(HttpStatus.FORBIDDEN, "Not an employee");
    }
    return employeeRepository
        .findByUser_Id(user.getId())
        .orElseThrow(() -> new ApiException(HttpStatus.CONFLICT, "Employee profile missing"));
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
    return new CompOffDtos.CompOffResponse(r.getId(), e.getId(), e.getName(), e.getEmployeeNumber(), r.getOvertimeDate(), r.getRequestedDate(), r.getOvertimeMinutes(), r.getReason(), r.getAttachmentUrl(), r.getAttachmentName(), r.getStatus(), r.getCreatedAt(), r.getDecidedAt(), decidedBy, r.getHrRemarks());
  }
}
