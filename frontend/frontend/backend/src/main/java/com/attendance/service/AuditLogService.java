package com.attendance.service;

import com.attendance.domain.AuditLog;
import com.attendance.repo.AuditLogRepository;
import java.time.Instant;
import java.time.LocalDate;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.util.List;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class AuditLogService {
  private final AuditLogRepository auditLogRepository;

  public AuditLogService(AuditLogRepository auditLogRepository) {
    this.auditLogRepository = auditLogRepository;
  }

  public List<AuditLog> latest() {
    return auditLogRepository.findTop100ByOrderByCreatedAtDesc();
  }

  public List<AuditLog> search(
      String actorUsername, String action, String targetType, String targetId, LocalDate fromDate, LocalDate toDate) {
    return auditLogRepository.findTop500ByOrderByCreatedAtDesc().stream()
        .filter(
            log ->
                matches(log.getActorUsername(), actorUsername)
                    && matches(log.getAction(), action)
                    && matches(log.getTargetType(), targetType)
                    && matches(log.getTargetId(), targetId)
                    && matchesDate(log.getCreatedAt(), fromDate, toDate))
        .toList();
  }

  @Transactional
  public void record(String actor, String action, String targetType, Object targetId, String details) {
    AuditLog log = new AuditLog();
    log.setActorUsername(blank(actor) ? "system" : actor.trim());
    log.setAction(action);
    log.setTargetType(targetType);
    log.setTargetId(targetId == null ? null : String.valueOf(targetId));
    log.setDetails(details == null || details.isBlank() ? null : details.trim());
    log.setCreatedAt(Instant.now());
    String previous = auditLogRepository.findTopByOrderByIdDesc().map(AuditLog::getEntryHash).orElse("GENESIS");
    log.setPreviousHash(previous);
    log.setEntryHash(hash(previous + "|" + log.getActorUsername() + "|" + log.getAction() + "|" + log.getTargetType() + "|" + log.getTargetId() + "|" + log.getDetails() + "|" + log.getCreatedAt()));
    auditLogRepository.save(log);
  }

  private static boolean blank(String value) {
    return value == null || value.isBlank();
  }

  private static boolean matches(String value, String expected) {
    if (blank(expected)) return true;
    String needle = expected.trim().toLowerCase();
    String hay = value == null ? "" : value.toLowerCase();
    return hay.contains(needle);
  }

  private static boolean matchesDate(Instant createdAt, LocalDate fromDate, LocalDate toDate) {
    if (createdAt == null) return false;
    LocalDate date = createdAt.atZone(AttendanceClock.ZONE).toLocalDate();
    if (fromDate != null && date.isBefore(fromDate)) return false;
    if (toDate != null && date.isAfter(toDate)) return false;
    return true;
  }

  private static String hash(String input) {
    try {
      byte[] digest = MessageDigest.getInstance("SHA-256").digest(input.getBytes(StandardCharsets.UTF_8));
      StringBuilder sb = new StringBuilder();
      for (byte b : digest) sb.append(String.format("%02x", b));
      return sb.toString();
    } catch (Exception e) {
      return "hash-error";
    }
  }
}
