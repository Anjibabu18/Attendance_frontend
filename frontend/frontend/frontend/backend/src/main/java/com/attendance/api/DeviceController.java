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
    Map<String, Object> res = new java.util.LinkedHashMap<>();
    res.put("deviceId", deviceId);
    res.put("approved", service.deviceApproved(username, deviceId));
    res.put("registered", service.isDeviceRegistered(username, deviceId));
    return res;
  }

  @PostMapping
  public Map<String, Object> register(@RequestBody ProductionDtos.DeviceRequest req) {
    String username = (String) SecurityContextHolder.getContext().getAuthentication().getPrincipal();
    return toResponse(service.registerDevice(username, req.getDeviceId(), req.getLabel()));
  }

  private static Map<String, Object> toResponse(DeviceRegistration d) {
    Map<String, Object> res = new java.util.LinkedHashMap<>();
    res.put("id", d.getId());
    res.put("username", d.getUser().getUsername());
    res.put("deviceId", d.getDeviceId());
    res.put("label", d.getLabel() == null ? "" : d.getLabel());
    res.put("approved", d.isApproved());
    res.put("createdAt", d.getCreatedAt());
    res.put("registered", true);
    return res;
  }
}
