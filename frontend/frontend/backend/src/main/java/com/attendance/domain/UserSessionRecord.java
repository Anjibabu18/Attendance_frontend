package com.attendance.domain;

import jakarta.persistence.*;
import java.time.Instant;

@Entity
@Table(name = "user_sessions")
public class UserSessionRecord {
  @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
  private Long id;
  @ManyToOne(fetch = FetchType.LAZY, optional = false) @JoinColumn(name = "user_id", nullable = false)
  private AppUser user;
  @Column(length = 80)
  private String ipAddress;
  @Column(length = 255)
  private String userAgent;
  @Column(nullable = false)
  private Instant loginAt = Instant.now();
  @Column(nullable = false)
  private boolean revoked;
  public Long getId() { return id; }
  public AppUser getUser() { return user; }
  public void setUser(AppUser user) { this.user = user; }
  public String getIpAddress() { return ipAddress; }
  public void setIpAddress(String ipAddress) { this.ipAddress = ipAddress; }
  public String getUserAgent() { return userAgent; }
  public void setUserAgent(String userAgent) { this.userAgent = userAgent; }
  public Instant getLoginAt() { return loginAt; }
  public void setLoginAt(Instant loginAt) { this.loginAt = loginAt; }
  public boolean isRevoked() { return revoked; }
  public void setRevoked(boolean revoked) { this.revoked = revoked; }
}
