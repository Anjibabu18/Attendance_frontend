package com.attendance.service;

import com.attendance.domain.AppUser;
import com.attendance.domain.CompOffRequest;
import com.attendance.domain.CompOffRequestStatus;
import com.attendance.domain.Employee;
import com.attendance.repo.CompOffRequestRepository;
import com.attendance.repo.UserRepository;
import java.time.Instant;
import java.time.LocalDate;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class CompOffService {
  private final CompOffRequestRepository compOffRepo;
  private final UserRepository userRepo;
  private final AttendanceService attendanceService;
  private final NotificationService notificationService;
  private final MailService mailService;
  private final CloudinaryService cloudinaryService;

  public CompOffService(CompOffRequestRepository compOffRepo, UserRepository userRepo, AttendanceService attendanceService, NotificationService notificationService, MailService mailService, CloudinaryService cloudinaryService) {
    this.compOffRepo = compOffRepo;
    this.userRepo = userRepo;
    this.attendanceService = attendanceService;
    this.notificationService = notificationService;
    this.mailService = mailService;
    this.cloudinaryService = cloudinaryService;
  }

  public List<CompOffRequest> listForEmployee(Employee employee) {
    return compOffRepo.findAllByEmployee_IdOrderByCreatedAtDesc(employee.getId());
  }

  public List<CompOffRequest> pending() {
    return compOffRepo.findAllByStatusOrderByCreatedAtDesc(CompOffRequestStatus.PENDING);
  }

  @Transactional
  public CompOffRequest create(Employee employee, LocalDate overtimeDate, LocalDate requestedDate, Integer overtimeMinutes, String reason) {
    if (overtimeDate == null || requestedDate == null || overtimeMinutes == null || overtimeMinutes <= 0) {
      throw new ApiException(HttpStatus.BAD_REQUEST, "Overtime date, comp-off date, and overtime minutes are required");
    }
    if (reason == null || reason.trim().isBlank()) throw new ApiException(HttpStatus.BAD_REQUEST, "Reason is required");
    CompOffRequest c = new CompOffRequest();
    c.setEmployee(employee);
    c.setOvertimeDate(overtimeDate);
    c.setRequestedDate(requestedDate);
    c.setOvertimeMinutes(overtimeMinutes);
    c.setReason(reason.trim());
    CompOffRequest saved = compOffRepo.save(c);
    mailService.notifyHr(
        "Comp-off request: " + employee.getName(),
        "Employee: " + employee.getName()
            + "\nEmployee #: " + employee.getEmployeeNumber()
            + "\nOvertime date: " + saved.getOvertimeDate()
            + "\nRequested off date: " + saved.getRequestedDate()
            + "\nOvertime minutes: " + saved.getOvertimeMinutes()
            + "\nReason: " + saved.getReason());
    return saved;
  }

  @Transactional
  public CompOffRequest approve(Long id, String hrUsername, String remarks) {
    CompOffRequest c = pending(id);
    AppUser hr = user(hrUsername);
    c.setStatus(CompOffRequestStatus.APPROVED);
    c.setDecidedAt(Instant.now());
    c.setDecidedBy(hr);
    c.setHrRemarks(clean(remarks));
    CompOffRequest saved = compOffRepo.save(c);
    attendanceService.upsert(saved.getEmployee().getId(), saved.getRequestedDate(), null, null, "Comp-off approved for overtime on " + saved.getOvertimeDate(), true);
    notificationService.notify(saved.getEmployee().getUser(), "Comp-off approved", saved.getRequestedDate().toString());
    mailService.notifyUser(
        saved.getEmployee().getUser().getUsername(),
        "Comp-off approved",
        "Your comp-off request for " + saved.getRequestedDate() + " was approved."
            + remarksText(saved.getHrRemarks()));
    return saved;
  }

  @Transactional
  public CompOffRequest reject(Long id, String hrUsername, String remarks) {
    CompOffRequest c = pending(id);
    AppUser hr = user(hrUsername);
    c.setStatus(CompOffRequestStatus.REJECTED);
    c.setDecidedAt(Instant.now());
    c.setDecidedBy(hr);
    c.setHrRemarks(clean(remarks));
    CompOffRequest saved = compOffRepo.save(c);
    notificationService.notify(saved.getEmployee().getUser(), "Comp-off rejected", saved.getRequestedDate().toString());
    mailService.notifyUser(
        saved.getEmployee().getUser().getUsername(),
        "Comp-off rejected",
        "Your comp-off request for " + saved.getRequestedDate() + " was rejected."
            + remarksText(saved.getHrRemarks()));
    return saved;
  }

  @Transactional
  public CompOffRequest attachDocument(Long id, Employee employee, org.springframework.web.multipart.MultipartFile file) {
    CompOffRequest request = compOffRepo.findById(id).orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Comp-off request not found"));
    if (!request.getEmployee().getId().equals(employee.getId())) {
      throw new ApiException(HttpStatus.FORBIDDEN, "Cannot update another employee's comp-off request");
    }
    var upload =
        cloudinaryService.uploadDocument(
            file, "comp-off-" + id + "/" + java.time.Instant.now().toEpochMilli());
    request.setAttachmentUrl(upload.url());
    request.setAttachmentName(clean(file == null ? null : file.getOriginalFilename()));
    return compOffRepo.save(request);
  }

  private CompOffRequest pending(Long id) {
    CompOffRequest c = compOffRepo.findById(id).orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Comp-off request not found"));
    if (c.getStatus() != CompOffRequestStatus.PENDING) throw new ApiException(HttpStatus.CONFLICT, "Comp-off request is not pending");
    return c;
  }

  private AppUser user(String username) {
    return userRepo.findByUsername(username).orElseThrow(() -> new ApiException(HttpStatus.UNAUTHORIZED, "Invalid token"));
  }

  private static String clean(String value) {
    String v = value == null ? "" : value.trim();
    return v.isBlank() ? null : v;
  }

  private static String remarksText(String remarks) {
    return remarks == null || remarks.isBlank() ? "" : "\nRemarks: " + remarks;
  }
}
