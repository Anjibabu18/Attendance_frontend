package com.attendance.api;

import com.attendance.api.dto.AttendanceDtos;
import com.attendance.domain.AppUser;
import com.attendance.domain.Role;
import com.attendance.repo.AttendanceRepository;
import com.attendance.repo.EmployeeRepository;
import com.attendance.repo.UserRepository;
import com.attendance.service.ApiException;
import com.attendance.service.AttendanceClock;
import com.attendance.service.AttendancePunchService;
import com.attendance.service.AttendanceService;
import com.attendance.service.ProductionFeatureService;
import jakarta.servlet.http.HttpServletRequest;
import java.time.Duration;
import java.time.LocalDate;
import java.time.LocalTime;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/api/employee/punch")
@PreAuthorize("hasAuthority('ROLE_EMPLOYEE')")
public class EmployeePunchController {
  private final UserRepository userRepository;
  private final EmployeeRepository employeeRepository;
  private final AttendanceRepository attendanceRepository;
  private final AttendancePunchService attendancePunchService;
  private final ProductionFeatureService productionFeatureService;
  private final AttendanceService attendanceService;

  public EmployeePunchController(
      UserRepository userRepository,
      EmployeeRepository employeeRepository,
      AttendanceRepository attendanceRepository,
      AttendancePunchService attendancePunchService,
      ProductionFeatureService productionFeatureService,
      AttendanceService attendanceService) {
    this.userRepository = userRepository;
    this.employeeRepository = employeeRepository;
    this.attendanceRepository = attendanceRepository;
    this.attendancePunchService = attendancePunchService;
    this.productionFeatureService = productionFeatureService;
    this.attendanceService = attendanceService;
  }

  @GetMapping("/today")
  public AttendanceDtos.AttendanceResponse today() {
    var emp = currentEmployee();
    attendanceService.autoCheckoutIncompleteEntries(emp.getId());
    var e = attendanceRepository.findByEmployee_IdAndDate(emp.getId(), AttendanceClock.today()).orElse(null);
    if (e == null) return null;
    return toResponse(e);
  }

  @GetMapping("/place")
  public AttendanceDtos.PunchPlaceResponse place(
      @RequestParam("latitude") double latitude, @RequestParam("longitude") double longitude) {
    var emp = currentEmployee();
    var place = attendancePunchService.evaluatePlace(emp, latitude, longitude);
    var office = AdminOfficeLocationController.toResponse(place.office());
    return new AttendanceDtos.PunchPlaceResponse(
        office,
        latitude,
        longitude,
        place.distanceMeters(),
        place.office().getRadiusMeters(),
        place.insideRadius());
  }

  @GetMapping("/qr")
  public java.util.Map<String, Object> qr(@RequestParam("token") String token) {
    var qr = productionFeatureService.validateQr(token);
    return productionFeatureService.qrResponse(qr);
  }

  @GetMapping("/device")
  public java.util.Map<String, Object> device(@RequestParam("deviceId") String deviceId) {
    String username = (String) SecurityContextHolder.getContext().getAuthentication().getPrincipal();
    return java.util.Map.of("approved", productionFeatureService.deviceApproved(username, deviceId));
  }

  @PostMapping("/checkin")
  public AttendanceDtos.AttendanceResponse checkIn(
      @RequestParam("latitude") double latitude,
      @RequestParam("longitude") double longitude,
      @RequestParam(value = "qrToken", required = false) String qrToken,
      @RequestParam("deviceId") String deviceId,
      @RequestParam("file") MultipartFile file,
      HttpServletRequest request) {
    var emp = currentEmployee();
    String username = (String) SecurityContextHolder.getContext().getAuthentication().getPrincipal();
    productionFeatureService.validateApprovedDevice(username, deviceId);
    productionFeatureService.validatePunchQrIfRequired(qrToken, emp);
    var e = attendancePunchService.checkIn(emp, latitude, longitude, file);
    return toResponse(e);
  }

  @PostMapping("/checkout")
  public AttendanceDtos.AttendanceResponse checkOut(
      @RequestParam("latitude") double latitude,
      @RequestParam("longitude") double longitude,
      @RequestParam(value = "qrToken", required = false) String qrToken,
      @RequestParam("deviceId") String deviceId,
      @RequestParam("file") MultipartFile file,
      HttpServletRequest request) {
    var emp = currentEmployee();
    String username = (String) SecurityContextHolder.getContext().getAuthentication().getPrincipal();
    productionFeatureService.validateApprovedDevice(username, deviceId);
    if (!hasTodayCheckIn(emp.getId())) {
      productionFeatureService.validatePunchQrIfRequired(qrToken, emp);
    }
    var e = attendancePunchService.checkOut(emp, latitude, longitude, file);
    return toResponse(e);
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

  private static AttendanceDtos.AttendanceResponse toResponse(com.attendance.domain.AttendanceEntry e) {
    return new AttendanceDtos.AttendanceResponse(
        e.getId(),
        e.getEmployee().getId(),
        e.getDate(),
        e.getInTime(),
        e.getOutTime(),
        workedMinutesForResponse(e),
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

  private static Integer workedMinutesForResponse(com.attendance.domain.AttendanceEntry e) {
    if (e.getWorkedMinutes() != null || e.getInTime() == null) {
      return e.getWorkedMinutes();
    }
    if (e.getOutTime() == null && !AttendanceClock.today().equals(e.getDate())) {
      return null;
    }

    LocalTime end = e.getOutTime() != null ? e.getOutTime() : AttendanceClock.now();
    long minutes = Duration.between(e.getInTime(), end).toMinutes();
    if (minutes < 0) minutes += 24L * 60L;
    return (int) Math.max(0, minutes);
  }

  private boolean hasTodayCheckIn(Long employeeId) {
    return attendanceRepository
        .findByEmployee_IdAndDate(employeeId, AttendanceClock.today())
        .map(e -> e.getInTime() != null)
        .orElse(false);
  }
}
