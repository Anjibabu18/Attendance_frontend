package com.attendance.api;

import com.attendance.api.dto.ProductionDtos;
import com.attendance.domain.DeviceRegistration;
import com.attendance.repo.UserRepository;
import com.attendance.service.ApiException;
import com.attendance.service.ProductionFeatureService;
import java.util.List;
import java.util.Map;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

@RestController
@RequestMapping("/api/admin/production")
@PreAuthorize("hasAuthority('ROLE_ADMIN')")
public class ProductionAdminController {
  private static final Logger log = LoggerFactory.getLogger(ProductionAdminController.class);
  private final ProductionFeatureService service;
  private final UserRepository userRepository;

  public ProductionAdminController(ProductionFeatureService service, UserRepository userRepository) {
    this.service = service;
    this.userRepository = userRepository;
  }

  @GetMapping("/devices")
  public List<Map<String, Object>> devices() {
    return service.devices().stream().map(ProductionAdminController::deviceResponse).toList();
  }

  @PostMapping("/devices/{id}/approval")
  public Map<String, Object> approveDevice(
      @PathVariable Long id,
      @RequestBody(required = false) ProductionDtos.DeviceApprovalRequest req) {
    String actor = (String) SecurityContextHolder.getContext().getAuthentication().getPrincipal();
    boolean approved = req == null || req.isApproved();
    return deviceResponse(service.approveDevice(id, approved, actor));
  }

  @PostMapping("/qr")
  public Object qr(@RequestBody ProductionDtos.QrRequest req) {
    return service.qrResponse(service.createQr(req.getOfficeId(), req.getMinutes()));
  }

  @GetMapping("/qr/latest")
  public Object latestQr(@RequestParam(required = false) Long officeId) {
    var q = service.latestQr(officeId);
    if (q == null)
      return Map.of();
    return service.qrResponse(q);
  }

  // Alternative endpoint to avoid path-matching conflicts with the image endpoint
  @GetMapping("/qr/latestToken")
  public Object latestQrToken(@RequestParam(required = false) Long officeId) {
    log.debug("latestQrToken called, officeId={}", officeId);
    var q = service.latestQr(officeId);
    if (q == null) {
      log.debug("latestQrToken: no token found for officeId={}", officeId);
      return Map.of();
    }
    log.debug("latestQrToken: returning token {} for officeId={}", q.getToken(), officeId);
    return service.qrResponse(q);
  }

  @GetMapping("/qr/{token}.png")
  public ResponseEntity<byte[]> qrImage(@PathVariable String token) {
    return ResponseEntity.ok().contentType(MediaType.IMAGE_PNG).body(service.qrPng(token));
  }

  @PostMapping("/leave-balances")
  public Object balance(@RequestBody ProductionDtos.BalanceRequest req) {
    return service.setBalance(req.getEmployeeId(), req.getLeaveType(), req.getYear(), req.getAllocatedDays(),
        req.getUsedDays());
  }

  @PostMapping("/policies")
  public Object policy(@RequestBody ProductionDtos.PolicyRequest req) {
    return service.snapshotPolicy(req.getVersionName());
  }

  @GetMapping("/policies")
  public Object policies() {
    return service.policies();
  }

  @PostMapping("/location-holidays")
  public Object locationHoliday(@RequestBody ProductionDtos.LocationHolidayRequest req) {
    return service.addLocationHoliday(req.getOfficeId(), req.getDate(), req.getName());
  }

  @GetMapping("/exceptions")
  public List<Map<String, Object>> exceptions() {
    return service.exceptions().stream().map(ProductionAdminController::exceptionResponse).toList();
  }

  @GetMapping("/sessions")
  public List<Map<String, Object>> sessions() {
    return service.sessions().stream().map(ProductionAdminController::sessionResponse).toList();
  }

  @GetMapping("/backup")
  public Map<String, Object> backup() {
    return service.backupSnapshot();
  }

  @PostMapping("/users/{username}/mfa")
  public Map<String, Object> mfa(@PathVariable String username, @RequestBody ProductionDtos.MfaRequest req) {
    var user = userRepository.findByUsername(username)
        .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "User not found"));
    user.setMfaEnabled(req.isEnabled());
    userRepository.save(user);
    return Map.of("username", username, "mfaEnabled", user.isMfaEnabled());
  }

  private static Map<String, Object> deviceResponse(DeviceRegistration d) {
    Map<String, Object> map = new java.util.LinkedHashMap<>();
    map.put("id", d.getId());
    map.put("username", d.getUser().getUsername());
    map.put("deviceId", d.getDeviceId());
    map.put("label", d.getLabel() == null ? "" : d.getLabel());
    map.put("approved", d.isApproved());
    map.put("createdAt", d.getCreatedAt());
    return map;
  }

  private static Map<String, Object> exceptionResponse(com.attendance.domain.AttendanceException e) {
    var employee = e.getEmployee();
    Map<String, Object> map = new java.util.LinkedHashMap<>();
    map.put("id", e.getId());
    map.put("employeeId", employee == null ? null : employee.getId());
    map.put("employeeName", employee == null ? null : employee.getName());
    map.put("employeeNumber", employee == null ? null : employee.getEmployeeNumber());
    map.put("type", e.getType());
    map.put("message", e.getMessage());
    map.put("resolved", e.isResolved());
    map.put("createdAt", e.getCreatedAt());
    return map;
  }

  private static Map<String, Object> sessionResponse(com.attendance.domain.UserSessionRecord s) {
    Map<String, Object> map = new java.util.LinkedHashMap<>();
    map.put("id", s.getId());
    map.put("username", s.getUser().getUsername());
    map.put("ipAddress", s.getIpAddress());
    map.put("userAgent", s.getUserAgent());
    map.put("loginAt", s.getLoginAt());
    map.put("revoked", s.isRevoked());
    return map;
  }
}
