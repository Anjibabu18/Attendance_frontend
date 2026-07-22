package com.attendance.api.dto;

import java.time.Instant;

public class NotificationDtos {
  public static class NotificationResponse {
    private final Long id;
    private final String title;
    private final String message;
    private final boolean read;
    private final Instant createdAt;
    public NotificationResponse(Long id, String title, String message, boolean read, Instant createdAt) {
      this.id = id; this.title = title; this.message = message; this.read = read; this.createdAt = createdAt;
    }
    public Long getId() { return id; }
    public String getTitle() { return title; }
    public String getMessage() { return message; }
    public boolean isRead() { return read; }
    public Instant getCreatedAt() { return createdAt; }
  }
}
