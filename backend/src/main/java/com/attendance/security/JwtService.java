package com.attendance.security;

import com.attendance.config.AppConfig;
import com.attendance.domain.Role;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.SignatureAlgorithm;
import io.jsonwebtoken.security.Keys;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.Date;
import javax.crypto.SecretKey;
import org.springframework.stereotype.Service;

@Service
public class JwtService {
  private final AppConfig appConfig;

  public JwtService(AppConfig appConfig) {
    this.appConfig = appConfig;
  }

  private SecretKey signingKey() {
    String secret = appConfig.getJwt().getSecret();
    if (secret == null || secret.length() < 32 || secret.startsWith("change-me")) {
      throw new IllegalStateException(
          "JWT_SECRET must be configured with at least 32 characters and must not use the default value");
    }
    byte[] bytes = secret.getBytes(StandardCharsets.UTF_8);
    return Keys.hmacShaKeyFor(bytes);
  }

  public String createToken(String username, Role role) {
    return createAccessToken(username, role);
  }

  public String createAccessToken(String username, Role role) {
    Instant now = Instant.now();
    Instant expiry = now.plusSeconds(15L * 60L); // 15 minutes
    return Jwts.builder()
        .issuer(appConfig.getJwt().getIssuer())
        .subject(username)
        .issuedAt(Date.from(now))
        .expiration(Date.from(expiry))
        .claim("role", role.name())
        .signWith(signingKey(), SignatureAlgorithm.HS256)
        .compact();
  }

  public String createRefreshToken(String username, Role role) {
    Instant now = Instant.now();
    Instant expiry = now.plusSeconds(30L * 24L * 60L * 60L); // 30 days
    return Jwts.builder()
        .issuer(appConfig.getJwt().getIssuer())
        .subject(username)
        .issuedAt(Date.from(now))
        .expiration(Date.from(expiry))
        .claim("role", role.name())
        .claim("type", "refresh")
        .signWith(signingKey(), SignatureAlgorithm.HS256)
        .compact();
  }

  public Claims parseClaims(String token) {
    return Jwts.parser()
        .verifyWith(signingKey())
        .requireIssuer(appConfig.getJwt().getIssuer())
        .build()
        .parseSignedClaims(token)
        .getPayload();
  }
}
