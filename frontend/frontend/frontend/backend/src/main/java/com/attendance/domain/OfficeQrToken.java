package com.attendance.domain;

import jakarta.persistence.*;
import java.time.Instant;

@Entity
@Table(name = "office_qr_tokens")
public class OfficeQrToken {
  @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
  private Long id;
  @ManyToOne(fetch = FetchType.LAZY, optional = false) @JoinColumn(name = "office_id", nullable = false)
  private OfficeLocation officeLocation;
  @Column(nullable = false, unique = true, length = 120)
  private String token;
  @Column(nullable = false)
  private Instant expiresAt;
  @Column(nullable = false)
  private Instant createdAt = Instant.now();
  public Long getId() { return id; }
  public OfficeLocation getOfficeLocation() { return officeLocation; }
  public void setOfficeLocation(OfficeLocation officeLocation) { this.officeLocation = officeLocation; }
  public String getToken() { return token; }
  public void setToken(String token) { this.token = token; }
  public Instant getExpiresAt() { return expiresAt; }
  public void setExpiresAt(Instant expiresAt) { this.expiresAt = expiresAt; }
  public Instant getCreatedAt() { return createdAt; }
  public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }
}
