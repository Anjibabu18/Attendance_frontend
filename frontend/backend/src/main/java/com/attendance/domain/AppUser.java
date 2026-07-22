package com.attendance.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;

@Entity
@Table(
    name = "users",
    uniqueConstraints = {@UniqueConstraint(name = "uk_users_username", columnNames = {"username"})})
public class AppUser {
  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  private Long id;

  @Column(nullable = false, length = 80)
  private String username;

  @Column(nullable = false, length = 100)
  private String passwordHash;

  @Enumerated(EnumType.STRING)
  @Column(nullable = false, length = 20)
  private Role role;

  @Column(nullable = false)
  private boolean enabled = true;

  @Column(name = "last_login_at")
  private java.time.Instant lastLoginAt;

  @Column(name = "last_login_ip", length = 80)
  private String lastLoginIp;

  @Column(name = "last_user_agent", length = 255)
  private String lastUserAgent;

  @Column(nullable = false)
  private boolean mfaEnabled = false;

  @Column(name = "mfa_secret", length = 120)
  private String mfaSecret;

  public Long getId() {
    return id;
  }

  public void setId(Long id) {
    this.id = id;
  }

  public String getUsername() {
    return username;
  }

  public void setUsername(String username) {
    this.username = username;
  }

  public String getPasswordHash() {
    return passwordHash;
  }

  public void setPasswordHash(String passwordHash) {
    this.passwordHash = passwordHash;
  }

  public Role getRole() {
    return role;
  }

  public void setRole(Role role) {
    this.role = role;
  }

  public boolean isEnabled() {
    return enabled;
  }

  public void setEnabled(boolean enabled) {
    this.enabled = enabled;
  }

  public java.time.Instant getLastLoginAt() {
    return lastLoginAt;
  }

  public void setLastLoginAt(java.time.Instant lastLoginAt) {
    this.lastLoginAt = lastLoginAt;
  }

  public String getLastLoginIp() {
    return lastLoginIp;
  }

  public void setLastLoginIp(String lastLoginIp) {
    this.lastLoginIp = lastLoginIp;
  }

  public String getLastUserAgent() {
    return lastUserAgent;
  }

  public void setLastUserAgent(String lastUserAgent) {
    this.lastUserAgent = lastUserAgent;
  }

  public boolean isMfaEnabled() {
    return mfaEnabled;
  }

  public void setMfaEnabled(boolean mfaEnabled) {
    this.mfaEnabled = mfaEnabled;
  }

  public String getMfaSecret() {
    return mfaSecret;
  }

  public void setMfaSecret(String mfaSecret) {
    this.mfaSecret = mfaSecret;
  }
}
