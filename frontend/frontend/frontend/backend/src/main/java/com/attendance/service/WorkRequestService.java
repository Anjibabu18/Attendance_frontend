package com.attendance.service;

import com.attendance.domain.AppUser;
import com.attendance.domain.Employee;
import com.attendance.domain.WorkRequest;
import com.attendance.domain.WorkRequestStatus;
import com.attendance.domain.WorkRequestType;
import com.attendance.repo.UserRepository;
import com.attendance.repo.WorkRequestRepository;
import java.time.Instant;
import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class WorkRequestService {
  private static final long MAX_RANGE_DAYS = 31;

  private final WorkRequestRepository workRequestRepository;
  private final UserRepository userRepository;
  private final AttendanceService attendanceService;
  private final AttendanceSettingsService attendanceSettingsService;
  private final NotificationService notificationService;
  private final MailService mailService;
  private final AuditLogService auditLogService;
  private final CloudinaryService cloudinaryService;

  public WorkRequestService(
      WorkRequestRepository workRequestRepository,
      UserRepository userRepository,
      AttendanceService attendanceService,
      AttendanceSettingsService attendanceSettingsService,
      NotificationService notificationService,
      MailService mailService,
      AuditLogService auditLogService,
      CloudinaryService cloudinaryService) {
    this.workRequestRepository = workRequestRepository;
    this.userRepository = userRepository;
    this.attendanceService = attendanceService;
    this.attendanceSettingsService = attendanceSettingsService;
    this.notificationService = notificationService;
    this.mailService = mailService;
    this.auditLogService = auditLogService;
    this.cloudinaryService = cloudinaryService;
  }

  public List<WorkRequest> listForEmployee(Employee employee) {
    return workRequestRepository.findAllByEmployee_IdOrderByCreatedAtDesc(employee.getId());
  }

  public List<WorkRequest> listPendingForHr() {
    return workRequestRepository.findAllByStatusInOrderByCreatedAtDesc(
        List.of(WorkRequestStatus.PENDING, WorkRequestStatus.MANAGER_RECOMMENDED));
  }

  public List<WorkRequest> listPendingForManager() {
    return workRequestRepository.findAllByStatusInOrderByCreatedAtDesc(List.of(WorkRequestStatus.PENDING));
  }

  @Transactional
  public WorkRequest create(Employee employee, WorkRequestType type, LocalDate fromDate, LocalDate toDate, String reason) {
    validate(type, fromDate, toDate, reason);
    boolean overlaps =
        workRequestRepository.existsByEmployee_IdAndStatusInAndFromDateLessThanEqualAndToDateGreaterThanEqual(
            employee.getId(),
            List.of(WorkRequestStatus.PENDING, WorkRequestStatus.MANAGER_RECOMMENDED, WorkRequestStatus.APPROVED),
            toDate,
            fromDate);
    if (overlaps) {
      throw new ApiException(HttpStatus.CONFLICT, "You already have a WFH/on-duty request overlapping these dates");
    }
    WorkRequest wr = new WorkRequest();
    wr.setEmployee(employee);
    wr.setType(type);
    wr.setFromDate(fromDate);
    wr.setToDate(toDate);
    wr.setReason(reason.trim());
    WorkRequest saved = workRequestRepository.save(wr);
    auditLogService.record(employee.getUser().getUsername(), "WORK_REQUEST_CREATED", "WORK_REQUEST", saved.getId(), type.name());
    mailService.notifyHr(
        label(saved.getType()) + " request: " + employee.getName(),
        "Employee: " + employee.getName()
            + "\nEmployee #: " + employee.getEmployeeNumber()
            + "\nType: " + label(saved.getType())
            + "\nDates: " + saved.getFromDate() + " -> " + saved.getToDate()
            + "\nReason: " + saved.getReason());
    return saved;
  }

  @Transactional
  public WorkRequest recommend(Long id, String managerUsername, String remarks) {
    WorkRequest wr = pending(id);
    AppUser manager = user(managerUsername);
    wr.setStatus(WorkRequestStatus.MANAGER_RECOMMENDED);
    wr.setDecidedAt(Instant.now());
    wr.setDecidedBy(manager);
    wr.setRemarks(clean(remarks));
    WorkRequest saved = workRequestRepository.save(wr);
    auditLogService.record(managerUsername, "WORK_REQUEST_RECOMMENDED", "WORK_REQUEST", saved.getId(), saved.getType().name());
    return saved;
  }

  @Transactional
  public WorkRequest approve(Long id, String hrUsername, String remarks) {
    WorkRequest wr =
        workRequestRepository
            .findById(id)
            .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Work request not found"));
    if (wr.getStatus() != WorkRequestStatus.PENDING && wr.getStatus() != WorkRequestStatus.MANAGER_RECOMMENDED) {
      throw new ApiException(HttpStatus.CONFLICT, "Work request is not pending");
    }
    AppUser hr = user(hrUsername);
    wr.setStatus(WorkRequestStatus.APPROVED);
    wr.setDecidedAt(Instant.now());
    wr.setDecidedBy(hr);
    wr.setRemarks(clean(remarks));
    WorkRequest saved = workRequestRepository.save(wr);

    String marker = saved.getType() == WorkRequestType.WORK_FROM_HOME ? "Work from home" : "On duty";
    for (LocalDate d = saved.getFromDate(); !d.isAfter(saved.getToDate()); d = d.plusDays(1)) {
      if (!attendanceService.isWorkingDay(d)) continue;
      var s = attendanceSettingsService.get();
      attendanceService.upsert(saved.getEmployee().getId(), d, s.getDefaultInTime(), s.getDefaultOutTime(), marker + ": " + saved.getReason(), true);
    }
    notificationService.notify(saved.getEmployee().getUser(), label(saved.getType()) + " approved", saved.getFromDate() + " -> " + saved.getToDate());
    mailService.notifyUser(
        saved.getEmployee().getUser().getUsername(),
        label(saved.getType()) + " approved",
        "Your " + label(saved.getType()).toLowerCase() + " request for "
            + saved.getFromDate() + " -> " + saved.getToDate() + " was approved."
            + remarksText(saved.getRemarks()));
    auditLogService.record(hrUsername, "WORK_REQUEST_APPROVED", "WORK_REQUEST", saved.getId(), saved.getType().name());
    return saved;
  }

  @Transactional
  public WorkRequest reject(Long id, String actorUsername, String remarks) {
    WorkRequest wr =
        workRequestRepository
            .findById(id)
            .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Work request not found"));
    if (wr.getStatus() == WorkRequestStatus.APPROVED || wr.getStatus() == WorkRequestStatus.REJECTED) {
      throw new ApiException(HttpStatus.CONFLICT, "Work request is already decided");
    }
    AppUser actor = user(actorUsername);
    wr.setStatus(WorkRequestStatus.REJECTED);
    wr.setDecidedAt(Instant.now());
    wr.setDecidedBy(actor);
    wr.setRemarks(clean(remarks));
    WorkRequest saved = workRequestRepository.save(wr);
    notificationService.notify(saved.getEmployee().getUser(), label(saved.getType()) + " rejected", saved.getFromDate() + " -> " + saved.getToDate());
    mailService.notifyUser(
        saved.getEmployee().getUser().getUsername(),
        label(saved.getType()) + " rejected",
        "Your " + label(saved.getType()).toLowerCase() + " request for "
            + saved.getFromDate() + " -> " + saved.getToDate() + " was rejected."
            + remarksText(saved.getRemarks()));
    auditLogService.record(actorUsername, "WORK_REQUEST_REJECTED", "WORK_REQUEST", saved.getId(), saved.getType().name());
    return saved;
  }

  @Transactional
  public WorkRequest attachDocument(Long id, Employee employee, org.springframework.web.multipart.MultipartFile file) {
    WorkRequest wr =
        workRequestRepository
            .findById(id)
            .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Work request not found"));
    if (!wr.getEmployee().getId().equals(employee.getId())) {
      throw new ApiException(HttpStatus.FORBIDDEN, "Cannot update another employee's work request");
    }
    var upload =
        cloudinaryService.uploadDocument(
            file, "work-" + id + "/" + java.time.Instant.now().toEpochMilli());
    wr.setAttachmentUrl(upload.url());
    wr.setAttachmentName(clean(file == null ? null : file.getOriginalFilename()));
    WorkRequest saved = workRequestRepository.save(wr);
    auditLogService.record(employee.getUser().getUsername(), "WORK_REQUEST_ATTACHMENT_UPLOADED", "WORK_REQUEST", saved.getId(), saved.getAttachmentName());
    return saved;
  }

  private WorkRequest pending(Long id) {
    WorkRequest wr =
        workRequestRepository
            .findById(id)
            .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Work request not found"));
    if (wr.getStatus() != WorkRequestStatus.PENDING) {
      throw new ApiException(HttpStatus.CONFLICT, "Work request is not pending");
    }
    return wr;
  }

  private AppUser user(String username) {
    return userRepository.findByUsername(username).orElseThrow(() -> new ApiException(HttpStatus.UNAUTHORIZED, "Invalid token"));
  }

  private static void validate(WorkRequestType type, LocalDate fromDate, LocalDate toDate, String reason) {
    if (type == null || fromDate == null || toDate == null) {
      throw new ApiException(HttpStatus.BAD_REQUEST, "type, fromDate, and toDate are required");
    }
    if (fromDate.isAfter(toDate)) {
      throw new ApiException(HttpStatus.BAD_REQUEST, "fromDate must be <= toDate");
    }
    if (ChronoUnit.DAYS.between(fromDate, toDate) + 1 > MAX_RANGE_DAYS) {
      throw new ApiException(HttpStatus.BAD_REQUEST, "Range too large (max " + MAX_RANGE_DAYS + " days)");
    }
    if (reason == null || reason.trim().isBlank()) {
      throw new ApiException(HttpStatus.BAD_REQUEST, "Reason is required");
    }
  }

  private static String clean(String remarks) {
    String value = remarks == null ? "" : remarks.trim();
    return value.isBlank() ? null : value;
  }

  private static String label(WorkRequestType type) {
    return type == WorkRequestType.WORK_FROM_HOME ? "Work from home" : "On duty";
  }

  private static String remarksText(String remarks) {
    return remarks == null || remarks.isBlank() ? "" : "\nRemarks: " + remarks;
  }
}
