package com.attendance.api.dto;

import com.attendance.domain.Role;
import jakarta.validation.constraints.NotBlank;

public class AuthDtos {
  public static class LoginRequest {
    @NotBlank private String username;
    @NotBlank private String password;

    public String getUsername() {
      return username;
    }

    public void setUsername(String username) {
      this.username = username;
    }

    public String getPassword() {
      return password;
    }

    public void setPassword(String password) {
      this.password = password;
    }
  }

  public static class LoginResponse {
    private String token;
    private String refreshToken;
    private Role role;
    private Long employeeId;
    private String name;

    public LoginResponse(String token, String refreshToken, Role role, Long employeeId, String name) {
      this.token = token;
      this.refreshToken = refreshToken;
      this.role = role;
      this.employeeId = employeeId;
      this.name = name;
    }

    public String getToken() {
      return token;
    }

    public String getRefreshToken() {
      return refreshToken;
    }

    public Role getRole() {
      return role;
    }

    public Long getEmployeeId() {
      return employeeId;
    }

    public String getName() {
      return name;
    }
  }

  public static class RefreshRequest {
    @NotBlank private String refreshToken;

    public String getRefreshToken() { return refreshToken; }
    public void setRefreshToken(String refreshToken) { this.refreshToken = refreshToken; }
  }

  public static class RefreshResponse {
    private String token;
    private String refreshToken;

    public RefreshResponse(String token, String refreshToken) {
      this.token = token;
      this.refreshToken = refreshToken;
    }

    public String getToken() { return token; }
    public String getRefreshToken() { return refreshToken; }
  }
}

