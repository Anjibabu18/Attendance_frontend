package com.attendance.security;

import io.jsonwebtoken.Claims;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.util.List;
import java.util.Set;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpHeaders;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

@Component
public class JwtAuthFilter extends OncePerRequestFilter {
  private static final Logger log = LoggerFactory.getLogger(JwtAuthFilter.class);
  private static final Set<String> ALLOWED_ROLES =
      Set.of("ROLE_ADMIN", "ROLE_HR", "ROLE_MANAGER", "ROLE_EMPLOYEE");
  private final JwtService jwtService;

  public JwtAuthFilter(JwtService jwtService) {
    this.jwtService = jwtService;
  }

  @Override
  protected void doFilterInternal(
      HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
      throws ServletException, IOException {
    String token = bearerToken(request);
    if (token != null) {
        try {
          Claims claims = jwtService.parseClaims(token);
          if (claims.get("type") != null && "refresh".equals(claims.get("type"))) {
            throw new IllegalArgumentException("Refresh token cannot be used as access token");
          }
          String username = claims.getSubject();
          String role = claims.get("role", String.class);
          if (username == null || username.isBlank() || !ALLOWED_ROLES.contains(role)) {
            throw new IllegalArgumentException("Invalid JWT claims");
          }
          var auth =
              new UsernamePasswordAuthenticationToken(
                  username, null, List.of(new SimpleGrantedAuthority(role)));
          auth.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));
          SecurityContextHolder.getContext().setAuthentication(auth);
        } catch (Exception e) {
          log.warn(
              "JWT parse failed: path={} method={} error={}:{}",
              request.getRequestURI(),
              request.getMethod(),
              e.getClass().getSimpleName(),
              e.getMessage());
          SecurityContextHolder.clearContext();
        }
    }
    filterChain.doFilter(request, response);
  }

  private static String bearerToken(HttpServletRequest request) {
    String header = request.getHeader(HttpHeaders.AUTHORIZATION);
    if (header != null) {
      String h = header.trim();
      if (h.length() >= 7 && h.regionMatches(true, 0, "Bearer ", 0, "Bearer ".length())) {
        return h.substring("Bearer ".length()).trim();
      }
    }
    if ("/api/realtime/events".equals(request.getRequestURI())) {
      String token = request.getParameter("token");
      if (token != null && !token.isBlank()) return token.trim();
    }
    return null;
  }
}
