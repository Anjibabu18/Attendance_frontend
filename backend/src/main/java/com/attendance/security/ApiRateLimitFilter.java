package com.attendance.security;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.time.Instant;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

@Component
public class ApiRateLimitFilter extends OncePerRequestFilter {
  private final Map<String, Bucket> buckets = new ConcurrentHashMap<>();

  @Override
  protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
      throws ServletException, IOException {
    String path = request.getRequestURI();
    if (path.startsWith("/api/auth") || path.contains("/punch") || path.contains("/export") || path.contains(".csv")) {
      String key = request.getRemoteAddr() + "|" + path;
      Bucket b = buckets.computeIfAbsent(key, k -> new Bucket());
      long now = Instant.now().getEpochSecond();
      if (now - b.windowStart > 60) { b.windowStart = now; b.count = 0; }
      b.count++;
      if (b.count > 120) {
        response.sendError(429, "Too many requests");
        return;
      }
    }
    filterChain.doFilter(request, response);
  }

  static class Bucket { long windowStart = Instant.now().getEpochSecond(); int count; }
}
