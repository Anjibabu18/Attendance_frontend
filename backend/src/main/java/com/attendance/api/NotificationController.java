package com.attendance.api;

import com.attendance.api.dto.NotificationDtos;
import com.attendance.service.NotificationService;
import java.util.List;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/notifications")
public class NotificationController {
  private final NotificationService notificationService;
  public NotificationController(NotificationService notificationService) { this.notificationService = notificationService; }
  @GetMapping
  public List<NotificationDtos.NotificationResponse> latest() {
    String username = (String) SecurityContextHolder.getContext().getAuthentication().getPrincipal();
    return notificationService.latest(username).stream()
        .map(n -> new NotificationDtos.NotificationResponse(n.getId(), n.getTitle(), n.getMessage(), n.isReadFlag(), n.getCreatedAt()))
        .toList();
  }

  @PostMapping("/read")
  public void markAllRead() {
    String username = (String) SecurityContextHolder.getContext().getAuthentication().getPrincipal();
    notificationService.markAllRead(username);
  }
}
