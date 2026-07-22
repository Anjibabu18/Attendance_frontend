package com.attendance.security;

import com.attendance.config.AppConfig;
import com.attendance.service.ApiException;
import java.time.Duration;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.Locale;
import java.util.concurrent.ConcurrentHashMap;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;

@Service
public class LoginAttemptService {
  private final AppConfig appConfig;
  private final ConcurrentHashMap<String, Attempt> attempts = new ConcurrentHashMap<>();

  public LoginAttemptService(AppConfig appConfig) {
    this.appConfig = appConfig;
  }

  public void assertAllowed(String username, String remoteAddress) {
    Attempt attempt = attempts.get(key(username, remoteAddress));
    if (attempt == null || attempt.lockedUntil == null)
      return;
    Instant now = Instant.now();
    if (now.isAfter(attempt.lockedUntil)) {
      attempts.remove(key(username, remoteAddress));
      return;
    }
    Duration remaining = Duration.between(now, attempt.lockedUntil);
    long minutes = remaining.toMinutes();
    long seconds = remaining.minusMinutes(minutes).getSeconds();
    String waitMessage;
    if (minutes > 0) {
      waitMessage = "Try again in "
          + minutes
          + " minute"
          + (minutes == 1 ? "" : "s")
          + (seconds > 0 ? " and " + seconds + " second" + (seconds == 1 ? "" : "s") : "")
          + ".";
    } else {
      waitMessage = "Try again in " + seconds + " second" + (seconds == 1 ? "" : "s") + ".";
    }
    throw new ApiException(HttpStatus.TOO_MANY_REQUESTS, "Too many failed login attempts. " + waitMessage);
  }

  public void recordSuccess(String username, String remoteAddress) {
    attempts.remove(key(username, remoteAddress));
  }

  public void recordFailure(String username, String remoteAddress) {
    String key = key(username, remoteAddress);
    int maxAttempts = Math.max(1, appConfig.getSecurity().getLoginMaxAttempts());
    int lockMinutes = Math.max(1, appConfig.getSecurity().getLoginLockMinutes());
    attempts.compute(
        key,
        (ignored, existing) -> {
          Attempt next = existing == null ? new Attempt() : existing;
          if (next.lockedUntil != null && Instant.now().isAfter(next.lockedUntil)) {
            next.failures = 0;
            next.lockedUntil = null;
          }
          next.failures++;
          if (next.failures >= maxAttempts) {
            next.lockedUntil = Instant.now().plus(lockMinutes, ChronoUnit.MINUTES);
          }
          return next;
        });
  }

  private static String key(String username, String remoteAddress) {
    String normalizedUser = username == null ? "" : username.trim().toLowerCase(Locale.ROOT);
    String normalizedAddress = remoteAddress == null ? "" : remoteAddress.trim();
    return normalizedUser + "|" + normalizedAddress;
  }

  private static class Attempt {
    private int failures;
    private Instant lockedUntil;
  }
}
