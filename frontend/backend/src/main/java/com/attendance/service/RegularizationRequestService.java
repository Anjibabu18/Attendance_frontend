package com.attendance.service;

import com.attendance.domain.AppUser;
import com.attendance.domain.Employee;
import com.attendance.domain.RegularizationRequest;
import com.attendance.domain.RegularizationStatus;
import com.attendance.repo.RegularizationRequestRepository;
import com.attendance.repo.UserRepository;
import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalTime;
import java.time.temporal.ChronoUnit;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class RegularizationRequestService {
  private static final int MAX_PAST_DAYS = 60;

  private final RegularizationRequestRepository regularizationRequestRepository;
  private final AttendanceService attendanceService;
  private final UserRepository userRepository;
  private final AuditLogService auditLogService;
  private final NotificationService notificationService;
  private final MailService mailService;
  private final CloudinaryService cloudinaryService;

  public RegularizationRequestService(
      RegularizationRequestRepository regularizationRequestRepository,
      AttendanceService attendanceService,
      UserRepository userRepository,
      AuditLogService auditLogService,
      NotificationService notificationService,
      MailService mailService,
      CloudinaryService cloudinaryService) {
    this.regularizationRequestRepository = regularizationRequestRepository;
    this.attendanceService = attendanceService;
    this.userRepository = userRepository;
    this.auditLogService = auditLogService;
    this.notificationService = notificationService;
    this.mailService = mailService;
    this.cloudinaryService = cloudinaryService;
  }

  public List<RegularizationRequest> listForEmployee(Employee employee) {
    return regularizationRequestRepository.findAllByEmployee_IdOrderByCreatedAtDesc(employee.getId());
  }

  public List<RegularizationRequest> listPending() {
    return regularizationRequestRepository.findAllByStatusOrderByCreatedAtDesc(RegularizationStatus.PENDING);
  }

  @Transactional
  public RegularizationRequest create(Employee employee, LocalDate date, LocalTime inTime, LocalTime outTime, String reason) {
    if (date == null) throw new ApiException(HttpStatus.BAD_REQUEST, "Date is required");
    LocalDate today = AttendanceClock.today();
    if (date.isAfter(today)) throw new ApiException(HttpStatus.BAD_REQUEST, "Future date correction is not allowed");
    if (ChronoUnit.DAYS.between(date, today) > MAX_PAST_DAYS) {
      throw new ApiException(HttpStatus.BAD_REQUEST, "Correction allowed only for last " + MAX_PAST_DAYS + " days");
    }
    if (inTime == null && outTime == null) throw new ApiException(HttpStatus.BAD_REQUEST, "In time or out time is required");
    String normalizedReason = reason == null ? "" : reason.trim();
    if (normalizedReason.isBlank()) throw new ApiException(HttpStatus.BAD_REQUEST, "Reason is required");
    if (regularizationRequestRepository.existsByEmployee_IdAndDateAndStatus(employee.getId(), date, RegularizationStatus.PENDING)) {
      throw new ApiException(HttpStatus.CONFLICT, "A pending correction already exists for this date");
    }

    RegularizationRequest request = new RegularizationRequest();
    request.setEmployee(employee);
    request.setDate(date);
    request.setRequestedInTime(inTime);
    request.setRequestedOutTime(outTime);
    request.setReason(normalizedReason);
    request.setStatus(RegularizationStatus.PENDING);
    request.setCreatedAt(Instant.now());
    RegularizationRequest saved = regularizationRequestRepository.save(request);
    auditLogService.record(employee.getUser().getUsername(), "REGULARIZATION_CREATED", "REGULARIZATION", saved.getId(), "date=" + date);
    mailService.notifyHr(
        "Attendance correction request: " + employee.getName(),
        "Employee: " + employee.getName()
            + "\nEmployee #: " + employee.getEmployeeNumber()
            + "\nDate: " + date
            + "\nRequested in: " + (inTime == null ? "--" : inTime)
            + "\nRequested out: " + (outTime == null ? "--" : outTime)
            + "\nReason: " + normalizedReason);
    return saved;
  }

  @Transactional
  public RegularizationRequest approve(Long id, String hrUsername, String remarks) {
    RegularizationRequest request = pending(id);
    AppUser hr = currentUser(hrUsername);
    request.setStatus(RegularizationStatus.APPROVED);
    request.setDecidedAt(Instant.now());
    request.setDecidedBy(hr);
    request.setHrRemarks(normalizeRemarks(remarks));
    RegularizationRequest saved = regularizationRequestRepository.save(request);
    attendanceService.upsert(
        saved.getEmployee().getId(),
        saved.getDate(),
        saved.getRequestedInTime(),
        saved.getRequestedOutTime(),
        saved.getReason(),
        true);
    auditLogService.record(hrUsername, "REGULARIZATION_APPROVED", "REGULARIZATION", saved.getId(), "employee=" + saved.getEmployee().getEmployeeNumber());
    notificationService.notify(saved.getEmployee().getUser(), "Correction approved", "Attendance corrected for " + saved.getDate());
    mailService.notifyUser(
        saved.getEmployee().getUser().getUsername(),
        "Attendance correction approved",
        "Your attendance correction for " + saved.getDate() + " was approved."
            + remarksText(saved.getHrRemarks()));
    return saved;
  }

  @Transactional
  public RegularizationRequest reject(Long id, String hrUsername, String remarks) {
    RegularizationRequest request = pending(id);
    AppUser hr = currentUser(hrUsername);
    request.setStatus(RegularizationStatus.REJECTED);
    request.setDecidedAt(Instant.now());
    request.setDecidedBy(hr);
    request.setHrRemarks(normalizeRemarks(remarks));
    RegularizationRequest saved = regularizationRequestRepository.save(request);
    auditLogService.record(hrUsername, "REGULARIZATION_REJECTED", "REGULARIZATION", saved.getId(), "employee=" + saved.getEmployee().getEmployeeNumber());
    notificationService.notify(saved.getEmployee().getUser(), "Correction rejected", "Attendance correction rejected for " + saved.getDate());
    mailService.notifyUser(
        saved.getEmployee().getUser().getUsername(),
        "Attendance correction rejected",
        "Your attendance correction for " + saved.getDate() + " was rejected."
            + remarksText(saved.getHrRemarks()));
    return saved;
  }

  @Transactional
  public RegularizationRequest attachDocument(Long id, Employee employee, org.springframework.web.multipart.MultipartFile file) {
    RegularizationRequest request =
        regularizationRequestRepository
            .findById(id)
            .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Correction request not found"));
    if (!request.getEmployee().getId().equals(employee.getId())) {
      throw new ApiException(HttpStatus.FORBIDDEN, "Cannot update another employee's correction request");
    }
    var upload =
        cloudinaryService.uploadDocument(
            file, "regularization-" + id + "/" + java.time.Instant.now().toEpochMilli());
    request.setAttachmentUrl(upload.url());
    request.setAttachmentName(clean(file == null ? null : file.getOriginalFilename(), 180));
    return regularizationRequestRepository.save(request);
  }

  private RegularizationRequest pending(Long id) {
    RegularizationRequest request =
        regularizationRequestRepository
            .findById(id)
            .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Correction request not found"));
    if (request.getStatus() != RegularizationStatus.PENDING) {
      throw new ApiException(HttpStatus.CONFLICT, "Correction request is not pending");
    }
    return request;
  }

  private AppUser currentUser(String username) {
    return userRepository.findByUsername(username).orElseThrow(() -> new ApiException(HttpStatus.UNAUTHORIZED, "Invalid token"));
  }

  private static String normalizeRemarks(String remarks) {
    String r = remarks == null ? "" : remarks.trim();
    return r.isBlank() ? null : r;
  }

  private static String clean(String value, int maxLength) {
    String v = value == null ? "" : value.trim();
    if (v.isBlank()) return null;
    return v.length() <= maxLength ? v : v.substring(0, maxLength);
  }

  private static String remarksText(String remarks) {
    return remarks == null || remarks.isBlank() ? "" : "\nRemarks: " + remarks;
  }
}
