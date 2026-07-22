package com.attendance.service;

import com.attendance.domain.*;
import com.attendance.repo.*;
import com.google.zxing.BarcodeFormat;
import com.google.zxing.client.j2se.MatrixToImageWriter;
import com.google.zxing.qrcode.QRCodeWriter;
import java.io.ByteArrayOutputStream;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.time.Instant;
import java.time.LocalDate;
import java.time.YearMonth;
import java.time.ZoneId;
import java.util.Map;
import java.util.UUID;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class ProductionFeatureService {
  private static final org.slf4j.Logger log = org.slf4j.LoggerFactory.getLogger(ProductionFeatureService.class);
  private final DeviceRegistrationRepository deviceRepo;
  private final OfficeQrTokenRepository qrRepo;
  private final OfficeLocationRepository officeRepo;
  private final LeaveBalanceRepository balanceRepo;
  private final EmployeeRepository employeeRepo;
  private final AttendancePolicyVersionRepository policyRepo;
  private final UserSessionRecordRepository sessionRepo;
  private final AttendanceExceptionRepository exceptionRepo;
  private final LocationHolidayRepository locationHolidayRepo;
  private final UserRepository userRepo;
  private final AttendanceSettingsService settingsService;
  private final AuditLogService auditLogService;
  private final MailService mailService;
  private final AttendanceRepository attendanceRepo;

  public ProductionFeatureService(DeviceRegistrationRepository deviceRepo, OfficeQrTokenRepository qrRepo,
      OfficeLocationRepository officeRepo, LeaveBalanceRepository balanceRepo, EmployeeRepository employeeRepo,
      AttendancePolicyVersionRepository policyRepo, UserSessionRecordRepository sessionRepo,
      AttendanceExceptionRepository exceptionRepo, LocationHolidayRepository locationHolidayRepo,
      UserRepository userRepo, AttendanceSettingsService settingsService, AuditLogService auditLogService, MailService mailService,
      AttendanceRepository attendanceRepo) {
    this.deviceRepo = deviceRepo;
    this.qrRepo = qrRepo;
    this.officeRepo = officeRepo;
    this.balanceRepo = balanceRepo;
    this.employeeRepo = employeeRepo;
    this.policyRepo = policyRepo;
    this.sessionRepo = sessionRepo;
    this.exceptionRepo = exceptionRepo;
    this.locationHolidayRepo = locationHolidayRepo;
    this.userRepo = userRepo;
    this.settingsService = settingsService;
    this.auditLogService = auditLogService;
    this.mailService = mailService;
    this.attendanceRepo = attendanceRepo;
  }

  @Transactional
  public DeviceRegistration registerDevice(String username, String deviceId, String label) {
    AppUser user = userRepo.findByUsername(username)
        .orElseThrow(() -> new ApiException(HttpStatus.UNAUTHORIZED, "Invalid token"));
    DeviceRegistration d = deviceRepo.findByUser_UsernameAndDeviceId(username, deviceId)
        .orElseGet(DeviceRegistration::new);
    boolean isNew = d.getId() == null;
    d.setUser(user);
    d.setDeviceId(deviceId);
    d.setLabel(label);
    if (isNew) {
      d.setApproved(false);
    }
    auditLogService.record(username, "DEVICE_REGISTERED", "DEVICE", deviceId, label);
    DeviceRegistration saved = deviceRepo.save(d);
    if (!saved.isApproved()) {
      mailService.notifyHr(
          "Device approval request: " + username,
          "User: " + username
              + "\nDevice ID: " + saved.getDeviceId()
              + "\nLabel: " + (saved.getLabel() == null ? "" : saved.getLabel()));
    }
    return saved;
  }

  @Transactional
  public DeviceRegistration approveDevice(Long id, boolean approved, String actor) {
    DeviceRegistration d = deviceRepo.findById(id)
        .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Device not found"));
    d.setApproved(approved);
    auditLogService.record(actor, approved ? "DEVICE_APPROVED" : "DEVICE_REVOKED", "DEVICE", id, d.getDeviceId());
    DeviceRegistration saved = deviceRepo.save(d);
    mailService.notifyUser(
        saved.getUser().getUsername(),
        approved ? "Device approved" : "Device rejected",
        "Your device " + saved.getDeviceId() + " was " + (approved ? "approved" : "rejected") + ".");
    return saved;
  }

  public boolean deviceApproved(String username, String deviceId) {
    if (deviceId == null || deviceId.isBlank())
      return false;
    return deviceRepo.findByUser_UsernameAndDeviceId(username, deviceId).map(DeviceRegistration::isApproved)
        .orElse(false);
  }

  public boolean isDeviceRegistered(String username, String deviceId) {
    if (deviceId == null || deviceId.isBlank())
      return false;
    return deviceRepo.findByUser_UsernameAndDeviceId(username, deviceId).isPresent();
  }

  public void validateApprovedDevice(String username, String deviceId) {
    if (deviceId == null || deviceId.isBlank()) {
      throw new ApiException(HttpStatus.BAD_REQUEST, "Device approval is required before punch");
    }
    boolean approved = deviceApproved(username, deviceId);
    if (!approved) {
      throw new ApiException(HttpStatus.FORBIDDEN, "This device is not approved for attendance punch");
    }
  }

  @Transactional
  public OfficeQrToken createQr(Long officeId, Integer minutes) {
    OfficeLocation office = officeRepo.findById(officeId)
        .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Office not found"));
    var settings = settingsService.get();
    if (Boolean.TRUE.equals(settings.getPermanentOfficeQr())) {
      var existing = qrRepo.findTopByOfficeLocation_IdOrderByCreatedAtDesc(officeId).orElse(null);
      if (existing != null && existing.getExpiresAt().isAfter(Instant.now())) {
        return existing;
      }
    }
    int effectiveMinutes = minutes != null && minutes > 0
        ? minutes
        : (settings.getQrTokenValidityMinutes() == null || settings.getQrTokenValidityMinutes() <= 0
            ? 10080
            : settings.getQrTokenValidityMinutes());
    OfficeQrToken q = new OfficeQrToken();
    q.setOfficeLocation(office);
    q.setToken(UUID.randomUUID().toString());
    if (Boolean.TRUE.equals(settings.getPermanentOfficeQr())) {
      q.setExpiresAt(Instant.now().plusSeconds(315360000L));
    } else {
      q.setExpiresAt(Instant.now().plusSeconds(Math.max(1, effectiveMinutes) * 60L));
    }
    return qrRepo.save(q);
  }

  public OfficeQrToken validateQr(String token) {
    String actualToken = token;
    if (token != null && token.contains("qrToken=")) {
      try {
        int idx = token.indexOf("qrToken=");
        actualToken = token.substring(idx + 8);
        int ampIdx = actualToken.indexOf('&');
        if (ampIdx != -1) {
          actualToken = actualToken.substring(0, ampIdx);
        }
        actualToken = actualToken.trim();
      } catch (Exception e) {
        // ignore and fallback
      }
    }
    OfficeQrToken q = qrRepo.findByToken(actualToken)
        .orElseThrow(() -> new ApiException(HttpStatus.BAD_REQUEST, "Invalid QR token"));
    if (q.getExpiresAt().isBefore(Instant.now())) {
      throw new ApiException(HttpStatus.BAD_REQUEST,
          Boolean.TRUE.equals(settingsService.get().getPermanentOfficeQr())
              ? "Printed office QR expired. Admin must regenerate it."
              : "QR token expired");
    }
    return q;
  }

  public void validateQrForEmployee(String token, Employee employee) {
    OfficeQrToken qr = validateQr(token);
    OfficeLocation assigned = employee.getAssignedOfficeLocation();
    if (assigned != null && !assigned.getId().equals(qr.getOfficeLocation().getId())) {
      throw new ApiException(HttpStatus.BAD_REQUEST, "QR token is for a different office");
    }
  }

  public void validatePunchQrIfRequired(String token, Employee employee) {
    boolean requireQr = Boolean.TRUE.equals(settingsService.get().getRequireQrForPunch());
    if (token == null || token.isBlank()) {
      if (requireQr) {
        throw new ApiException(HttpStatus.BAD_REQUEST, "QR token is required for attendance punch");
      }
      return;
    }
    validateQrForEmployee(token, employee);
  }

  public byte[] qrPng(String token) {
    validateQr(token);
    try {
      String qrContent = "https://attendance-two-smoky.vercel.app/?qrToken=" + token;
      var matrix = new QRCodeWriter().encode(qrContent, BarcodeFormat.QR_CODE, 320, 320);
      ByteArrayOutputStream out = new ByteArrayOutputStream();
      MatrixToImageWriter.writeToStream(matrix, "PNG", out);
      return out.toByteArray();
    } catch (Exception e) {
      throw new ApiException(HttpStatus.INTERNAL_SERVER_ERROR, "QR image generation failed");
    }
  }

  public Map<String, Object> qrResponse(OfficeQrToken q) {
    boolean permanent = Boolean.TRUE.equals(settingsService.get().getPermanentOfficeQr());
    Instant dailyExpiresAt = dailyQrExpiresAt();
    return Map.of(
        "valid", true,
        "token", q.getToken(),
        "officeId", q.getOfficeLocation().getId(),
        "officeName", q.getOfficeLocation().getOfficeName(),
        "createdAt", q.getCreatedAt(),
        "expiresAt", permanent ? dailyExpiresAt : q.getExpiresAt(),
        "printedQrExpiresAt", q.getExpiresAt(),
        "dailyCode", permanent ? dailyQrCode(q.getToken()) : "",
        "mode", permanent ? "FIXED_QR_DAILY_CODE" : "ROTATING_TOKEN");
  }

  private Instant dailyQrExpiresAt() {
    ZoneId zone = AttendanceClock.ZONE;
    return LocalDate.now(zone).plusDays(1).atStartOfDay(zone).toInstant();
  }

  private String dailyQrCode(String token) {
    try {
      String raw = token + "|" + AttendanceClock.today();
      byte[] hash = MessageDigest.getInstance("SHA-256").digest(raw.getBytes(StandardCharsets.UTF_8));
      StringBuilder sb = new StringBuilder();
      for (int i = 0; i < 4; i++) {
        sb.append(String.format("%02X", hash[i]));
      }
      return sb.toString();
    } catch (Exception e) {
      throw new ApiException(HttpStatus.INTERNAL_SERVER_ERROR, "Daily QR code generation failed");
    }
  }

  @Transactional
  public LeaveBalance setBalance(Long employeeId, String type, int year, double allocated, double used) {
    Employee e = employeeRepo.findById(employeeId)
        .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Employee not found"));
    LeaveBalance b = balanceRepo.findByEmployee_IdAndLeaveTypeAndYear(employeeId, type, year)
        .orElseGet(LeaveBalance::new);
    b.setEmployee(e);
    b.setLeaveType(type);
    b.setYear(year);
    b.setAllocatedDays(allocated);
    b.setUsedDays(used);
    return balanceRepo.save(b);
  }

  @Transactional
  public AttendancePolicyVersion snapshotPolicy(String versionName) {
    var s = settingsService.get();
    AttendancePolicyVersion p = new AttendancePolicyVersion();
    p.setVersionName(versionName == null || versionName.isBlank() ? "Policy " + Instant.now() : versionName);
    p.setEffectiveFrom(Instant.now());
    p.setSnapshotJson(
        "{\"in\":\"" + s.getDefaultInTime() + "\",\"out\":\"" + s.getDefaultOutTime() + "\",\"weekend\":\""
            + s.getWeekendDays() + "\",\"full\":" + s.getFullDayMinutes() + ",\"half\":" + s.getHalfDayMinutes() + "}");
    return policyRepo.save(p);
  }

  @Transactional
  public UserSessionRecord recordSession(AppUser user, String ip, String ua) {
    UserSessionRecord r = new UserSessionRecord();
    r.setUser(user);
    r.setIpAddress(ip);
    r.setUserAgent(ua);
    r.setLoginAt(Instant.now());
    return sessionRepo.save(r);
  }

  @Transactional
  public AttendanceException createException(Employee employee, String type, String message) {
    AttendanceException e = new AttendanceException();
    e.setEmployee(employee);
    e.setType(type);
    e.setMessage(message);
    e.setResolved(false);
    e.setCreatedAt(Instant.now());
    return exceptionRepo.save(e);
  }

  @Transactional
  public LocationHoliday addLocationHoliday(Long officeId, LocalDate date, String name) {
    OfficeLocation office = officeRepo.findById(officeId)
        .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Office not found"));
    LocationHoliday h = new LocationHoliday();
    h.setOfficeLocation(office);
    h.setDate(date);
    h.setName(name);
    return locationHolidayRepo.save(h);
  }

  public Map<String, Object> backupSnapshot() {
    return Map.of("employees", employeeRepo.count(), "sessions", sessionRepo.count(), "exceptions",
        exceptionRepo.count(), "policies", policyRepo.count(), "generatedAt", Instant.now());
  }

  public java.util.List<DeviceRegistration> devices() {
    return deviceRepo.findAll();
  }

  public java.util.List<DeviceRegistration> pendingDevices() {
    return deviceRepo.findAll().stream().filter(d -> !d.isApproved()).toList();
  }

  public java.util.List<AttendanceException> exceptions() {
    return exceptionRepo.findTop100ByResolvedFalseOrderByCreatedAtDesc();
  }

  @Transactional
  public Map<String, Object> scanMissingCheckouts() {
    java.util.List<AttendanceEntry> entries = attendanceRepo.findAllByInTimeIsNotNullAndOutTimeIsNullAndDateBefore(AttendanceClock.today());
    int created = 0;
    for (AttendanceEntry entry : entries) {
      Employee employee = entry.getEmployee();
      if (employee == null) continue;
      String message = "Checked in on " + entry.getDate() + " at " + entry.getInTime() + " but checkout is still missing";
      if (exceptionRepo.existsByEmployee_IdAndTypeAndMessageAndResolvedFalse(employee.getId(), "MISSING_CHECKOUT", message)) continue;
      createException(employee, "MISSING_CHECKOUT", message);
      created++;
      mailService.notifyUser(employee.getUser().getUsername(), "Missing checkout reminder", message + ". Please submit an attendance correction if needed.");
    }
    return Map.of("openEntries", entries.size(), "createdExceptions", created);
  }
  public java.util.List<UserSessionRecord> sessions() {
    return sessionRepo.findTop100ByOrderByLoginAtDesc();
  }

  public java.util.List<AttendancePolicyVersion> policies() {
    return policyRepo.findTop20ByOrderByEffectiveFromDesc();
  }

  public java.util.List<LeaveBalance> balances(Long employeeId, int year) {
    return balanceRepo.findAllByEmployee_IdAndYear(employeeId, year);
  }

  public java.util.List<Map<String, Object>> balanceViews(Long employeeId, int year) {
    return balances(employeeId, year).stream().map(ProductionFeatureService::balanceView).toList();
  }

  public OfficeQrToken latestQr(Long officeId) {
    log.debug("latestQr called officeId={}", officeId);
    if (officeId != null) {
      var found = qrRepo.findTopByOfficeLocation_IdOrderByCreatedAtDesc(officeId).orElse(null);
      log.debug("latestQr found={} for officeId={}", found == null ? null : found.getToken(), officeId);
      return found;
    }
    var found = qrRepo.findTopByOrderByCreatedAtDesc().orElse(null);
    log.debug("latestQr found global={}", found == null ? null : found.getToken());
    return found;
  }

  public static Map<String, Object> balanceView(LeaveBalance b) {
    double remaining = b.getAllocatedDays() - b.getUsedDays();
    return Map.of(
        "id", b.getId(),
        "employeeId", b.getEmployee().getId(),
        "employeeName", b.getEmployee().getName(),
        "employeeNumber", b.getEmployee().getEmployeeNumber(),
        "leaveType", b.getLeaveType(),
        "year", b.getYear(),
        "allocatedDays", b.getAllocatedDays(),
        "usedDays", b.getUsedDays(),
        "remainingDays", remaining);
  }

  @Transactional
  public AttendanceException resolveException(Long id, String actor) {
    AttendanceException e = exceptionRepo.findById(id)
        .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Exception not found"));
    e.setResolved(true);
    auditLogService.record(actor, "ATTENDANCE_EXCEPTION_RESOLVED", "ATTENDANCE_EXCEPTION", id, e.getType());
    return exceptionRepo.save(e);
  }
}


