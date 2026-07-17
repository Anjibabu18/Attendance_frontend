package com.attendance.service;

import com.attendance.domain.AttendanceEntry;
import com.attendance.domain.Employee;
import com.attendance.domain.OfficeLocation;
import com.attendance.repo.AttendanceRepository;
import com.attendance.repo.PunchAttemptRepository;
import java.time.Instant;
import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

@Service
public class AttendancePunchService {
  private final AttendanceRepository attendanceRepository;
  private final AttendanceService attendanceService;
  private final OfficeLocationService officeLocationService;
  private final CloudinaryService cloudinaryService;
  private final PunchAttemptRepository punchAttemptRepository;
  private final AuditLogService auditLogService;
  private final RealtimeEventService realtimeEventService;
  private final ProductionFeatureService productionFeatureService;
  private final FaceVerificationService faceVerificationService;

  public AttendancePunchService(
      AttendanceRepository attendanceRepository,
      AttendanceService attendanceService,
      OfficeLocationService officeLocationService,
      CloudinaryService cloudinaryService,
      PunchAttemptRepository punchAttemptRepository,
      AuditLogService auditLogService,
      RealtimeEventService realtimeEventService,
      ProductionFeatureService productionFeatureService,
      FaceVerificationService faceVerificationService) {
    this.attendanceRepository = attendanceRepository;
    this.attendanceService = attendanceService;
    this.officeLocationService = officeLocationService;
    this.cloudinaryService = cloudinaryService;
    this.punchAttemptRepository = punchAttemptRepository;
    this.auditLogService = auditLogService;
    this.realtimeEventService = realtimeEventService;
    this.productionFeatureService = productionFeatureService;
    this.faceVerificationService = faceVerificationService;
  }

  @Transactional
  public AttendanceEntry checkIn(Employee employee, double latitude, double longitude, MultipartFile photo) {
    attendanceService.autoCheckoutIncompleteEntries(employee.getId());
    validatePunchInput(latitude, longitude, photo);
    assertWithinAssignedOffice(employee, latitude, longitude);

    LocalDate today = AttendanceClock.today();
    var existing = attendanceRepository.findByEmployee_IdAndDate(employee.getId(), today).orElse(null);
    if (existing != null && existing.getInTime() != null) {
      throw new ApiException(
          HttpStatus.CONFLICT,
          "Already checked in today at " + existing.getInTime().truncatedTo(ChronoUnit.MINUTES));
    }

    var inTime = AttendanceClock.nowMinute();
    AttendanceEntry entry =
        attendanceService.upsert(employee.getId(), today, inTime, null, null, false);

    applyFaceVerification(entry, employee, photo, true);
    var upload =
        cloudinaryService.uploadAttendancePhoto(
            photo, "emp-" + employee.getId() + "/" + today + "/checkin");
    entry.setCheckInLatitude(latitude);
    entry.setCheckInLongitude(longitude);
    entry.setCheckInPhotoUrl(upload.url());
    var saved = attendanceRepository.save(entry);
    inspectFraudSignals(employee, "CHECK_IN", latitude, longitude);
    recordAttempt(employee, "CHECK_IN", latitude, longitude, true, "Selfie verified and inside office radius");
    realtimeEventService.publishAttendanceChanged("CHECK_IN", employee.getName());
    return saved;
  }

  @Transactional
  public AttendanceEntry checkOut(Employee employee, double latitude, double longitude, MultipartFile photo) {
    attendanceService.autoCheckoutIncompleteEntries(employee.getId());
    validatePunchInput(latitude, longitude, photo);
    assertWithinAssignedOffice(employee, latitude, longitude);

    LocalDate today = AttendanceClock.today();
    AttendanceEntry existing =
        attendanceRepository
            .findByEmployee_IdAndDate(employee.getId(), today)
            .orElseThrow(() -> new ApiException(HttpStatus.BAD_REQUEST, "No check-in found for today"));

    if (existing.getInTime() == null) {
      throw new ApiException(HttpStatus.BAD_REQUEST, "No check-in found for today");
    }
    if (existing.getOutTime() != null) {
      throw new ApiException(
          HttpStatus.CONFLICT,
          "Already checked out today at " + existing.getOutTime().truncatedTo(ChronoUnit.MINUTES));
    }

    var outTime = AttendanceClock.nowMinute();
    AttendanceEntry entry =
        attendanceService.upsert(employee.getId(), today, existing.getInTime(), outTime, null, false);

    applyFaceVerification(entry, employee, photo, false);
    var upload =
        cloudinaryService.uploadAttendancePhoto(
            photo, "emp-" + employee.getId() + "/" + today + "/checkout");
    entry.setCheckOutLatitude(latitude);
    entry.setCheckOutLongitude(longitude);
    entry.setCheckOutPhotoUrl(upload.url());
    var saved = attendanceRepository.save(entry);
    inspectFraudSignals(employee, "CHECK_OUT", latitude, longitude);
    recordAttempt(employee, "CHECK_OUT", latitude, longitude, true, "Selfie verified and inside office radius");
    realtimeEventService.publishAttendanceChanged("CHECK_OUT", employee.getName());
    return saved;
  }

  public PunchPlace evaluatePlace(Employee employee, double latitude, double longitude) {
    validateCoordinates(latitude, longitude);
    OfficeLocation office = effectiveOffice(employee);
    double distance =
        OfficeLocationService.distanceMeters(
            office.getLatitude(), office.getLongitude(), latitude, longitude);
    return new PunchPlace(office, distance, distance <= office.getRadiusMeters());
  }

  private void assertWithinAssignedOffice(Employee employee, double latitude, double longitude) {
    PunchPlace place = evaluatePlace(employee, latitude, longitude);
    OfficeLocation office = place.office();
    double distance = place.distanceMeters();
    if (distance > office.getRadiusMeters()) {
      recordAttempt(employee, "OUTSIDE_RADIUS", latitude, longitude, false, "Distance " + Math.round(distance) + "m from " + (office.getOfficeName() == null ? "office" : office.getOfficeName()));
      throw new ApiException(
          HttpStatus.BAD_REQUEST,
          "Outside office radius. Distance: "
              + Math.round(distance)
              + "m, Allowed: "
              + Math.round(office.getRadiusMeters())
              + "m, Office: "
              + (office.getOfficeName() == null || office.getOfficeName().isBlank()
                  ? office.getId()
                  : office.getOfficeName()));
    }
  }

  private void recordAttempt(Employee employee, String type, double latitude, double longitude, boolean success, String message) {
    com.attendance.domain.PunchAttempt attempt = new com.attendance.domain.PunchAttempt();
    attempt.setEmployee(employee);
    attempt.setType(type);
    attempt.setLatitude(latitude);
    attempt.setLongitude(longitude);
    attempt.setSuccess(success);
    attempt.setMessage(message);
    try {
      PunchPlace place = evaluatePlace(employee, latitude, longitude);
      attempt.setDistanceMeters(place.distanceMeters());
    } catch (Exception ignored) {
    }
    punchAttemptRepository.save(attempt);
    auditLogService.record(employee.getUser().getUsername(), success ? "PUNCH_SUCCESS" : "PUNCH_ALERT", "PUNCH", employee.getId(), message);
    if (!success) {
      productionFeatureService.createException(employee, type, message);
      realtimeEventService.publishAttendanceChanged(type, employee.getName());
    }
  }

  private void inspectFraudSignals(Employee employee, String type, double latitude, double longitude) {
    List<com.attendance.domain.PunchAttempt> recent =
        punchAttemptRepository.findTop50ByCreatedAtAfterOrderByCreatedAtDesc(
            Instant.now().minus(java.time.Duration.ofHours(24))).stream()
            .filter(p -> p.getEmployee() != null && p.getEmployee().getId().equals(employee.getId()))
            .toList();

    com.attendance.domain.PunchAttempt lastSuccess =
        recent.stream().filter(com.attendance.domain.PunchAttempt::isSuccess).findFirst().orElse(null);
    if (lastSuccess != null
        && lastSuccess.getLatitude() != null
        && lastSuccess.getLongitude() != null
        && lastSuccess.getCreatedAt() != null
        && lastSuccess.getCreatedAt().isAfter(Instant.now().minus(java.time.Duration.ofHours(2)))) {
      double distance =
          OfficeLocationService.distanceMeters(
              lastSuccess.getLatitude(), lastSuccess.getLongitude(), latitude, longitude);
      if (distance > 80000) {
        productionFeatureService.createException(
            employee,
            "IMPOSSIBLE_TRAVEL",
            type + " is " + Math.round(distance / 1000d) + " km away from previous punch within 2 hours");
      }
    }

    long repeatedCoords =
        recent.stream()
            .filter(p -> p.getLatitude() != null && p.getLongitude() != null)
            .filter(p -> rounded(p.getLatitude()) == rounded(latitude) && rounded(p.getLongitude()) == rounded(longitude))
            .count();
    if (repeatedCoords >= 3) {
      productionFeatureService.createException(
          employee,
          "REPEATED_COORDINATE_REUSE",
          "Same punch coordinates reused " + (repeatedCoords + 1) + " times in the last 24 hours");
    }
  }

  private void applyFaceVerification(AttendanceEntry entry, Employee employee, MultipartFile photo, boolean checkIn) {
    var result = faceVerificationService.verify(employee, photo);
    if (checkIn) {
      entry.setCheckInFaceScore(result.similarityScore());
      entry.setCheckInFaceVerified(result.verified());
    } else {
      entry.setCheckOutFaceScore(result.similarityScore());
      entry.setCheckOutFaceVerified(result.verified());
    }
    if (result.similarityScore() == null) {
      productionFeatureService.createException(employee, "FACE_VERIFICATION_UNAVAILABLE", result.message());
      throw new ApiException(HttpStatus.BAD_REQUEST, "Face verification failed: " + result.message());
    }
    auditLogService.record(
        employee.getUser().getUsername(),
        result.verified() ? "FACE_VERIFIED" : "FACE_MISMATCH_ALERT",
        "PUNCH",
        employee.getId(),
        "score=" + Math.round(result.similarityScore() * 100));
    if (!result.verified()) {
      productionFeatureService.createException(
          employee,
          "FACE_MISMATCH_ALERT",
          "Punch selfie similarity score " + Math.round(result.similarityScore() * 100) + "%: " + result.message());
      throw new ApiException(
          HttpStatus.BAD_REQUEST,
          "Face verification failed. Score "
              + Math.round(result.similarityScore() * 100)
              + "%. " + result.message());
    }
  }

  private OfficeLocation effectiveOffice(Employee employee) {
    return employee.getAssignedOfficeLocation() != null && employee.getAssignedOfficeLocation().isActive()
        ? employee.getAssignedOfficeLocation()
        : officeLocationService.getActiveOrThrow();
  }

  private static void validatePunchInput(double latitude, double longitude, MultipartFile photo) {
    validateCoordinates(latitude, longitude);
    if (photo == null || photo.isEmpty()) {
      throw new ApiException(HttpStatus.BAD_REQUEST, "Selfie photo is required for punch");
    }
    String contentType = photo.getContentType();
    if (contentType == null || !contentType.toLowerCase().startsWith("image/")) {
      throw new ApiException(HttpStatus.BAD_REQUEST, "Punch photo must be an image");
    }
  }

  private static void validateCoordinates(double latitude, double longitude) {
    if (Double.isNaN(latitude) || latitude < -90 || latitude > 90) {
      throw new ApiException(HttpStatus.BAD_REQUEST, "latitude must be between -90 and 90");
    }
    if (Double.isNaN(longitude) || longitude < -180 || longitude > 180) {
      throw new ApiException(HttpStatus.BAD_REQUEST, "longitude must be between -180 and 180");
    }
  }

  private static long rounded(double value) {
    return Math.round(value * 100000d);
  }

  public record PunchPlace(OfficeLocation office, double distanceMeters, boolean insideRadius) {}
}
