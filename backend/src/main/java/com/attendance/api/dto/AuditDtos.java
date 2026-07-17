package com.attendance.api.dto;

import java.time.Instant;

public class AuditDtos {
  public static class AuditLogResponse {
    private final Long id;
    private final String actorUsername;
    private final String action;
    private final String targetType;
    private final String targetId;
    private final String details;
    private final Instant createdAt;

    public AuditLogResponse(Long id, String actorUsername, String action, String targetType, String targetId, String details, Instant createdAt) {
      this.id = id; this.actorUsername = actorUsername; this.action = action; this.targetType = targetType; this.targetId = targetId; this.details = details; this.createdAt = createdAt;
    }
    public Long getId() { return id; }
    public String getActorUsername() { return actorUsername; }
    public String getAction() { return action; }
    public String getTargetType() { return targetType; }
    public String getTargetId() { return targetId; }
    public String getDetails() { return details; }
    public Instant getCreatedAt() { return createdAt; }
  }
}
