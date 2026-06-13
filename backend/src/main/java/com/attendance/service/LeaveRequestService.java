package com.attendance.service;

import com.attendance.domain.AppUser;
import com.attendance.domain.Employee;
import com.attendance.domain.LeaveRequest;
import com.attendance.domain.LeaveRequestStatus;
import com.attendance.repo.LeaveRequestRepository;
import com.attendance.repo.LeaveBalanceRepository;
import com.attendance.repo.UserRepository;
import java.time.Instant;
import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class LeaveRequestService {
  private static final long MAX_RANGE_DAYS = 31;

  private final LeaveRequestRepository leaveRequestRepository;
  private final AttendanceService attendanceService;
  private final LeaveBalanceRepository leaveBalanceRepository;
  private final UserRepository userRepository;
  private final MailService mailService;
  private final NotificationService notificationService;
  private final CloudinaryService cloudinaryService;

  public LeaveRequestService(
      LeaveRequestRepository leaveRequestRepository,
      AttendanceService attendanceService,
      LeaveBalanceRepository leaveBalanceRepository,
      UserRepository userRepository,
      MailService mailService,
      NotificationService notificationService,
      CloudinaryService cloudinaryService) {
    this.leaveRequestRepository = leaveRequestRepository;
    this.attendanceService = attendanceService;
    this.leaveBalanceRepository = leaveBalanceRepository;
    this.userRepository = userRepository;
    this.mailService = mailService;
    this.notificationService = notificationService;
    this.cloudinaryService = cloudinaryService;
  }

  public List<LeaveRequest> listForEmployee(Employee employee) {
    return leaveRequestRepository.findAllByEmployee_IdOrderByCreatedAtDesc(employee.getId());
  }

  public List<LeaveRequest> listPending() {
    return leaveRequestRepository.findAllByStatusInOrderByCreatedAtDesc(
        List.of(LeaveRequestStatus.PENDING, LeaveRequestStatus.CANCELLATION_REQUESTED));
  }

  @Transactional
  public LeaveRequest create(Employee employee, LocalDate fromDate, LocalDate toDate, String reason) {
    return create(employee, fromDate, toDate, reason, null, null, null);
  }

  @Transactional
  public LeaveRequest create(
      Employee employee,
      LocalDate fromDate,
      LocalDate toDate,
      String reason,
      String leaveType,
      String mailSubject,
      String mailMessage) {
    validateDates(fromDate, toDate);
    String normalizedReason = reason == null ? "" : reason.trim();
    if (normalizedReason.isBlank()) {
      throw new ApiException(HttpStatus.BAD_REQUEST, "Reason is required");
    }

    boolean overlaps =
        leaveRequestRepository.existsByEmployee_IdAndStatusInAndFromDateLessThanEqualAndToDateGreaterThanEqual(
            employee.getId(),
            List.of(LeaveRequestStatus.PENDING, LeaveRequestStatus.APPROVED),
            toDate,
            fromDate);
    if (overlaps) {
      throw new ApiException(
          HttpStatus.CONFLICT, "You already have a pending/approved leave request overlapping these dates");
    }

    LeaveRequest lr = new LeaveRequest();
    lr.setEmployee(employee);
    lr.setFromDate(fromDate);
    lr.setToDate(toDate);
    lr.setReason(normalizedReason);
    lr.setLeaveType(clean(leaveType, 40));
    lr.setMailSubject(clean(mailSubject, 160));
    lr.setMailMessage(clean(mailMessage, 2000));
    lr.setStatus(LeaveRequestStatus.PENDING);
    lr.setCreatedAt(Instant.now());
    LeaveRequest saved = leaveRequestRepository.save(lr);

    String subject =
        lr.getMailSubject() == null || lr.getMailSubject().isBlank()
            ? "Leave request: " + employee.getName() + " (" + employee.getEmployeeNumber() + ")"
            : lr.getMailSubject();
    mailService.notifyHr(
        subject,
        "Employee: "
            + employee.getName()
            + " ("
            + employee.getEmployeeNumber()
            + ")\n"
            + "Dates: "
            + fromDate
            + " -> "
            + toDate
            + "\n"
            + "Leave type: "
            + (lr.getLeaveType() == null ? "General" : lr.getLeaveType())
            + "\n"
            + "Reason: "
            + normalizedReason
            + (lr.getMailMessage() == null || lr.getMailMessage().isBlank()
                ? ""
                : "\n\nEmployee message:\n" + lr.getMailMessage())
            + "\n\n"
            + "Login to the HR dashboard to approve/reject.");

    return saved;
  }

  @Transactional
  public LeaveRequest approve(Long leaveRequestId, String hrUsername, String remarks) {
    LeaveRequest lr =
        leaveRequestRepository
            .findById(leaveRequestId)
            .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Leave request not found"));
    if (lr.getStatus() != LeaveRequestStatus.PENDING) {
      throw new ApiException(HttpStatus.CONFLICT, "Leave request is not pending");
    }
    AppUser hr =
        userRepository
            .findByUsername(hrUsername)
            .orElseThrow(() -> new ApiException(HttpStatus.UNAUTHORIZED, "Invalid token"));

    lr.setStatus(LeaveRequestStatus.APPROVED);
    lr.setDecidedAt(Instant.now());
    lr.setDecidedBy(hr);
    lr.setHrRemarks(normalizeRemarks(remarks));
    LeaveRequest saved = leaveRequestRepository.save(lr);

    // Mark leave in attendance for working days only.
    Employee emp = saved.getEmployee();
    int leaveDays = 0;
    for (LocalDate d = saved.getFromDate(); !d.isAfter(saved.getToDate()); d = d.plusDays(1)) {
      if (!attendanceService.isWorkingDay(d)) continue;
      attendanceService.upsert(emp.getId(), d, null, null, saved.getReason(), true);
      leaveDays++;
    }
    deductLeaveBalance(emp, saved, leaveDays);

    String employeeEmail = emp.getUser().getUsername();
    mailService.notifyUser(
        employeeEmail,
        "Leave approved: " + saved.getFromDate() + " -> " + saved.getToDate(),
        "Your leave request has been APPROVED.\n"
            + "Dates: "
            + saved.getFromDate()
            + " -> "
            + saved.getToDate()
            + "\n"
            + "Reason: "
            + saved.getReason()
            + (saved.getHrRemarks() != null ? ("\nHR remarks: " + saved.getHrRemarks()) : "")
            + "\n");
    notificationService.notify(emp.getUser(), "Leave approved", saved.getFromDate() + " -> " + saved.getToDate());

    return saved;
  }

  @Transactional
  public LeaveRequest reject(Long leaveRequestId, String hrUsername, String remarks) {
    LeaveRequest lr =
        leaveRequestRepository
            .findById(leaveRequestId)
            .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Leave request not found"));
    if (lr.getStatus() != LeaveRequestStatus.PENDING) {
      throw new ApiException(HttpStatus.CONFLICT, "Leave request is not pending");
    }
    AppUser hr =
        userRepository
            .findByUsername(hrUsername)
            .orElseThrow(() -> new ApiException(HttpStatus.UNAUTHORIZED, "Invalid token"));

    lr.setStatus(LeaveRequestStatus.REJECTED);
    lr.setDecidedAt(Instant.now());
    lr.setDecidedBy(hr);
    lr.setHrRemarks(normalizeRemarks(remarks));
    LeaveRequest saved = leaveRequestRepository.save(lr);

    Employee emp = saved.getEmployee();
    String employeeEmail = emp.getUser().getUsername();
    mailService.notifyUser(
        employeeEmail,
        "Leave rejected: " + saved.getFromDate() + " -> " + saved.getToDate(),
        "Your leave request has been REJECTED.\n"
            + "Dates: "
            + saved.getFromDate()
            + " -> "
            + saved.getToDate()
            + "\n"
            + "Reason: "
            + saved.getReason()
            + (saved.getHrRemarks() != null ? ("\nHR remarks: " + saved.getHrRemarks()) : "")
            + "\n");
    notificationService.notify(emp.getUser(), "Leave rejected", saved.getFromDate() + " -> " + saved.getToDate());

    return saved;
  }

  @Transactional
  public LeaveRequest cancelOrRequestCancellation(Long leaveRequestId, Employee employee, String reason) {
    LeaveRequest lr =
        leaveRequestRepository
            .findById(leaveRequestId)
            .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Leave request not found"));
    if (!lr.getEmployee().getId().equals(employee.getId())) {
      throw new ApiException(HttpStatus.FORBIDDEN, "Cannot cancel another employee's leave");
    }
    if (lr.getStatus() == LeaveRequestStatus.PENDING) {
      lr.setStatus(LeaveRequestStatus.CANCELLED);
      lr.setHrRemarks(clean(reason, 255));
    } else if (lr.getStatus() == LeaveRequestStatus.APPROVED) {
      lr.setStatus(LeaveRequestStatus.CANCELLATION_REQUESTED);
      lr.setHrRemarks(clean(reason, 255));
      mailService.notifyHr("Leave cancellation request: " + employee.getName(), "Employee requested cancellation for approved leave " + lr.getFromDate() + " -> " + lr.getToDate() + "\nReason: " + (reason == null ? "" : reason));
    } else {
      throw new ApiException(HttpStatus.CONFLICT, "Leave cannot be cancelled in current status");
    }
    return leaveRequestRepository.save(lr);
  }

  @Transactional
  public LeaveRequest approveCancellation(Long leaveRequestId, String hrUsername, String remarks) {
    LeaveRequest lr =
        leaveRequestRepository
            .findById(leaveRequestId)
            .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Leave request not found"));
    if (lr.getStatus() != LeaveRequestStatus.CANCELLATION_REQUESTED) {
      throw new ApiException(HttpStatus.CONFLICT, "Cancellation is not pending");
    }
    AppUser hr = userRepository.findByUsername(hrUsername).orElseThrow(() -> new ApiException(HttpStatus.UNAUTHORIZED, "Invalid token"));
    lr.setStatus(LeaveRequestStatus.CANCELLED);
    lr.setDecidedAt(Instant.now());
    lr.setDecidedBy(hr);
    lr.setHrRemarks(normalizeRemarks(remarks));
    // Keep attendance rows for audit; HR can manually adjust if needed.
    notificationService.notify(lr.getEmployee().getUser(), "Leave cancellation approved", lr.getFromDate() + " -> " + lr.getToDate());
    LeaveRequest saved = leaveRequestRepository.save(lr);
    mailService.notifyUser(
        saved.getEmployee().getUser().getUsername(),
        "Leave cancellation approved: " + saved.getFromDate() + " -> " + saved.getToDate(),
        "Your leave cancellation request has been APPROVED.\n"
            + "Dates: "
            + saved.getFromDate()
            + " -> "
            + saved.getToDate()
            + (saved.getHrRemarks() != null ? ("\nHR remarks: " + saved.getHrRemarks()) : "")
            + "\n");
    return saved;
  }

  @Transactional
  public LeaveRequest rejectCancellation(Long leaveRequestId, String hrUsername, String remarks) {
    LeaveRequest lr =
        leaveRequestRepository
            .findById(leaveRequestId)
            .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Leave request not found"));
    if (lr.getStatus() != LeaveRequestStatus.CANCELLATION_REQUESTED) {
      throw new ApiException(HttpStatus.CONFLICT, "Cancellation is not pending");
    }
    AppUser hr = userRepository.findByUsername(hrUsername).orElseThrow(() -> new ApiException(HttpStatus.UNAUTHORIZED, "Invalid token"));
    lr.setStatus(LeaveRequestStatus.APPROVED);
    lr.setDecidedAt(Instant.now());
    lr.setDecidedBy(hr);
    lr.setHrRemarks(normalizeRemarks(remarks));
    notificationService.notify(lr.getEmployee().getUser(), "Leave cancellation rejected", lr.getFromDate() + " -> " + lr.getToDate());
    LeaveRequest saved = leaveRequestRepository.save(lr);
    mailService.notifyUser(
        saved.getEmployee().getUser().getUsername(),
        "Leave cancellation rejected: " + saved.getFromDate() + " -> " + saved.getToDate(),
        "Your leave cancellation request has been REJECTED.\n"
            + "Dates: "
            + saved.getFromDate()
            + " -> "
            + saved.getToDate()
            + (saved.getHrRemarks() != null ? ("\nHR remarks: " + saved.getHrRemarks()) : "")
            + "\n");
    return saved;
  }

  @Transactional
  public LeaveRequest attachDocument(Long leaveRequestId, Employee employee, org.springframework.web.multipart.MultipartFile file) {
    LeaveRequest lr =
        leaveRequestRepository
            .findById(leaveRequestId)
            .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Leave request not found"));
    if (!lr.getEmployee().getId().equals(employee.getId())) {
      throw new ApiException(HttpStatus.FORBIDDEN, "Cannot update another employee's leave request");
    }
    var upload =
        cloudinaryService.uploadDocument(
            file, "leave-" + leaveRequestId + "/" + java.time.Instant.now().toEpochMilli());
    lr.setAttachmentUrl(upload.url());
    lr.setAttachmentName(clean(file == null ? null : file.getOriginalFilename(), 180));
    return leaveRequestRepository.save(lr);
  }

  private static void validateDates(LocalDate fromDate, LocalDate toDate) {
    if (fromDate == null || toDate == null) {
      throw new ApiException(HttpStatus.BAD_REQUEST, "fromDate and toDate are required");
    }
    if (fromDate.isAfter(toDate)) {
      throw new ApiException(HttpStatus.BAD_REQUEST, "fromDate must be <= toDate");
    }
    long days = ChronoUnit.DAYS.between(fromDate, toDate) + 1;
    if (days > MAX_RANGE_DAYS) {
      throw new ApiException(
          HttpStatus.BAD_REQUEST, "Range too large (max " + MAX_RANGE_DAYS + " days)");
    }
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

  private void deductLeaveBalance(Employee employee, LeaveRequest request, int leaveDays) {
    if (leaveDays <= 0) return;
    int year = request.getFromDate().getYear();
    String leaveType = normalizeLeaveType(request.getLeaveType());
    var balance =
        leaveBalanceRepository
            .findByEmployee_IdAndLeaveTypeAndYear(employee.getId(), leaveType, year)
            .orElseGet(com.attendance.domain.LeaveBalance::new);
    if (balance.getEmployee() == null) {
      balance.setEmployee(employee);
      balance.setLeaveType(leaveType);
      balance.setYear(year);
      balance.setAllocatedDays(0);
      balance.setUsedDays(0);
    }
    balance.setUsedDays(balance.getUsedDays() + leaveDays);
    leaveBalanceRepository.save(balance);
  }

  private static String normalizeLeaveType(String leaveType) {
    String raw = leaveType == null ? "" : leaveType.trim();
    if (raw.isBlank()) return "CASUAL_LEAVE";
    return raw.toUpperCase(java.util.Locale.ROOT).replaceAll("[^A-Z0-9]+", "_").replaceAll("^_+|_+$", "");
  }
}
