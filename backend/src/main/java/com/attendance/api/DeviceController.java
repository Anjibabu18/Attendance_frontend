package com.attendance.api;

import com.attendance.api.dto.ProductionDtos;
import com.attendance.domain.DeviceRegistration;
import com.attendance.service.ProductionFeatureService;
import java.util.Map;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/account/devices")
public class DeviceController {
  private final ProductionFeatureService service;
  public DeviceController(ProductionFeatureService service) { this.service = service; }

  @GetMapping("/current")
  public Map<String, Object> current(@RequestParam("deviceId") String deviceId) {
    String username = (String) SecurityContextHolder.getContext().getAuthentication().getPrincipal();
    return Map.of("deviceId", deviceId, "approved", service.deviceApproved(username, deviceId));
  }

  @PostMapping
  public Map<String, Object> register(@RequestBody ProductionDtos.DeviceRequest req) {
    String username = (String) SecurityContextHolder.getContext().getAuthentication().getPrincipal();
    return toResponse(service.registerDevice(username, req.getDeviceId(), req.getLabel()));
  }

  private static Map<String, Object> toResponse(DeviceRegistration d) {
    return Map.of(
        "id", d.getId(),
        "username", d.getUser().getUsername(),
        "deviceId", d.getDeviceId(),
        "label", d.getLabel() == null ? "" : d.getLabel(),
        "approved", d.isApproved(),
        "createdAt", d.getCreatedAt());
  }
}
