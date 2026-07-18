package com.attendance.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.time.Instant;

@Entity
@Table(name = "audit_logs")
public class AuditLog {
  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  private Long id;

  @Column(nullable = false, length = 80)
  private String actorUsername;

  @Column(nullable = false, length = 80)
  private String action;

  @Column(nullable = false, length = 80)
  private String targetType;

  @Column(length = 80)
  private String targetId;

  @Column(length = 1000)
  private String details;

  @Column(name = "previous_hash", length = 128)
  private String previousHash;

  @Column(name = "entry_hash", length = 128)
  private String entryHash;

  @Column(nullable = false)
  private Instant createdAt = Instant.now();

  public Long getId() { return id; }
  public String getActorUsername() { return actorUsername; }
  public void setActorUsername(String actorUsername) { this.actorUsername = actorUsername; }
  public String getAction() { return action; }
  public void setAction(String action) { this.action = action; }
  public String getTargetType() { return targetType; }
  public void setTargetType(String targetType) { this.targetType = targetType; }
  public String getTargetId() { return targetId; }
  public void setTargetId(String targetId) { this.targetId = targetId; }
  public String getDetails() { return details; }
  public void setDetails(String details) { this.details = details; }
  public String getPreviousHash() { return previousHash; }
  public void setPreviousHash(String previousHash) { this.previousHash = previousHash; }
  public String getEntryHash() { return entryHash; }
  public void setEntryHash(String entryHash) { this.entryHash = entryHash; }
  public Instant getCreatedAt() { return createdAt; }
  public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }
}
