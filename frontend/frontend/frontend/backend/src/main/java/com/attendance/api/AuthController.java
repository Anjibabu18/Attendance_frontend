package com.attendance.api;

import com.attendance.api.dto.AuthDtos;
import com.attendance.domain.AppUser;
import com.attendance.domain.Role;
import com.attendance.repo.EmployeeRepository;
import com.attendance.repo.UserRepository;
import com.attendance.security.JwtService;
import com.attendance.security.LoginAttemptService;
import com.attendance.service.ApiException;
import com.attendance.service.AuditLogService;
import com.attendance.service.ProductionFeatureService;
import io.jsonwebtoken.Claims;
import jakarta.validation.Valid;
import jakarta.servlet.http.HttpServletRequest;
import java.util.Map;
import org.springframework.http.HttpStatus;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/auth")
public class AuthController {
  private final AuthenticationManager authenticationManager;
  private final UserRepository userRepository;
  private final EmployeeRepository employeeRepository;
  private final JwtService jwtService;
  private final LoginAttemptService loginAttemptService;
  private final AuditLogService auditLogService;
  private final ProductionFeatureService productionFeatureService;

  public AuthController(
      AuthenticationManager authenticationManager,
      UserRepository userRepository,
      EmployeeRepository employeeRepository,
      JwtService jwtService,
      LoginAttemptService loginAttemptService,
      AuditLogService auditLogService,
      ProductionFeatureService productionFeatureService) {
    this.authenticationManager = authenticationManager;
    this.userRepository = userRepository;
    this.employeeRepository = employeeRepository;
    this.jwtService = jwtService;
    this.loginAttemptService = loginAttemptService;
    this.auditLogService = auditLogService;
    this.productionFeatureService = productionFeatureService;
  }

  @PostMapping("/login")
  public AuthDtos.LoginResponse login(
      @Valid @RequestBody AuthDtos.LoginRequest req, HttpServletRequest request) {
    String remoteAddress = clientAddress(request);
    loginAttemptService.assertAllowed(req.getUsername(), remoteAddress);
    Authentication auth;
    try {
      auth =
          authenticationManager.authenticate(
              new UsernamePasswordAuthenticationToken(req.getUsername(), req.getPassword()));
    } catch (AuthenticationException e) {
      loginAttemptService.recordFailure(req.getUsername(), remoteAddress);
      throw new ApiException(HttpStatus.UNAUTHORIZED, "Invalid login");
    }
    if (!auth.isAuthenticated()) throw new ApiException(HttpStatus.UNAUTHORIZED, "Invalid login");

    AppUser user =
        userRepository
            .findByUsername(req.getUsername())
            .orElseThrow(() -> new ApiException(HttpStatus.UNAUTHORIZED, "Invalid login"));
    loginAttemptService.recordSuccess(req.getUsername(), remoteAddress);
    user.setLastLoginAt(java.time.Instant.now());
    user.setLastLoginIp(remoteAddress);
    String ua = request.getHeader("User-Agent");
    user.setLastUserAgent(ua == null ? null : ua.substring(0, Math.min(255, ua.length())));
    userRepository.save(user);
    productionFeatureService.recordSession(user, remoteAddress, user.getLastUserAgent());
    auditLogService.record(user.getUsername(), "LOGIN_SUCCESS", "USER", user.getId(), "ip=" + remoteAddress);
    String token = jwtService.createAccessToken(user.getUsername(), user.getRole());
    String refreshToken = jwtService.createRefreshToken(user.getUsername(), user.getRole());
    if (user.getRole() == Role.ROLE_EMPLOYEE) {
      var emp =
          employeeRepository
              .findByUser_Id(user.getId())
              .orElseThrow(() -> new ApiException(HttpStatus.CONFLICT, "Employee profile missing"));
      return new AuthDtos.LoginResponse(token, refreshToken, user.getRole(), emp.getId(), emp.getName());
    }
    return new AuthDtos.LoginResponse(token, refreshToken, user.getRole(), null, user.getUsername());
  }

  @PostMapping("/refresh")
  public AuthDtos.RefreshResponse refresh(@Valid @RequestBody AuthDtos.RefreshRequest req) {
    try {
      Claims claims = jwtService.parseClaims(req.getRefreshToken());
      if (claims.get("type") == null || !"refresh".equals(claims.get("type"))) {
        throw new ApiException(HttpStatus.UNAUTHORIZED, "Invalid refresh token type");
      }
      String username = claims.getSubject();
      String roleStr = claims.get("role", String.class);
      Role role = Role.valueOf(roleStr);
      AppUser user = userRepository.findByUsername(username)
          .orElseThrow(() -> new ApiException(HttpStatus.UNAUTHORIZED, "User not found"));
      if (!user.isEnabled()) {
        throw new ApiException(HttpStatus.UNAUTHORIZED, "User is disabled");
      }
      String newAccessToken = jwtService.createAccessToken(username, role);
      String newRefreshToken = jwtService.createRefreshToken(username, role);
      return new AuthDtos.RefreshResponse(newAccessToken, newRefreshToken);
    } catch (Exception e) {
      throw new ApiException(HttpStatus.UNAUTHORIZED, "Invalid or expired refresh token");
    }
  }

  @GetMapping("/me")
  public Map<String, Object> me() {
    Authentication auth = SecurityContextHolder.getContext().getAuthentication();
    String username = (String) auth.getPrincipal();
    AppUser user =
        userRepository
            .findByUsername(username)
            .orElseThrow(() -> new ApiException(HttpStatus.UNAUTHORIZED, "Invalid token"));
    return Map.of("username", user.getUsername(), "role", user.getRole().name());
  }

  private static String clientAddress(HttpServletRequest request) {
    String forwardedFor = request.getHeader("X-Forwarded-For");
    if (forwardedFor != null && !forwardedFor.isBlank()) {
      return forwardedFor.split(",")[0].trim();
    }
    return request.getRemoteAddr();
  }
}
