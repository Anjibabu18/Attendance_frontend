package com.attendance.config;

import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Configuration;

@Configuration
@ConfigurationProperties(prefix = "app")
public class AppConfig {
  private Jwt jwt = new Jwt();
  private Attendance attendance = new Attendance();
  private Cloudinary cloudinary = new Cloudinary();
  private Face face = new Face();
  private Mail mail = new Mail();
  private Cors cors = new Cors();
  private Security security = new Security();

  public Jwt getJwt() {
    return jwt;
  }

  public void setJwt(Jwt jwt) {
    this.jwt = jwt;
  }

  public Attendance getAttendance() {
    return attendance;
  }

  public void setAttendance(Attendance attendance) {
    this.attendance = attendance;
  }

  public Cloudinary getCloudinary() {
    return cloudinary;
  }

  public void setCloudinary(Cloudinary cloudinary) {
    this.cloudinary = cloudinary;
  }

  public Face getFace() {
    return face;
  }

  public void setFace(Face face) {
    this.face = face;
  }

  public Mail getMail() {
    return mail;
  }

  public void setMail(Mail mail) {
    this.mail = mail;
  }

  public Cors getCors() {
    return cors;
  }

  public void setCors(Cors cors) {
    this.cors = cors;
  }

  public Security getSecurity() {
    return security;
  }

  public void setSecurity(Security security) {
    this.security = security;
  }

  public static class Jwt {
    private String secret;
    private String issuer;
    private long expiresMinutes;

    public String getSecret() {
      return secret;
    }

    public void setSecret(String secret) {
      this.secret = secret;
    }

    public String getIssuer() {
      return issuer;
    }

    public void setIssuer(String issuer) {
      this.issuer = issuer;
    }

    public long getExpiresMinutes() {
      return expiresMinutes;
    }

    public void setExpiresMinutes(long expiresMinutes) {
      this.expiresMinutes = expiresMinutes;
    }
  }

  public static class Attendance {
    private int minDailyMinutes;
    private String defaultJoinDate;


    public int getMinDailyMinutes() {
      return minDailyMinutes;
    }

    public void setMinDailyMinutes(int minDailyMinutes) {
      this.minDailyMinutes = minDailyMinutes;
    }

    public String getDefaultJoinDate() {
      return defaultJoinDate;
    }

    public void setDefaultJoinDate(String defaultJoinDate) {
      this.defaultJoinDate = defaultJoinDate;
    }


  }

  public static class Cloudinary {
    private String cloudName;
    private String apiKey;
    private String apiSecret;

    public String getCloudName() {
      return cloudName;
    }

    public void setCloudName(String cloudName) {
      this.cloudName = cloudName;
    }

    public String getApiKey() {
      return apiKey;
    }

    public void setApiKey(String apiKey) {
      this.apiKey = apiKey;
    }

    public String getApiSecret() {
      return apiSecret;
    }

    public void setApiSecret(String apiSecret) {
      this.apiSecret = apiSecret;
    }
  }

  public static class Face {
    private boolean serviceEnabled;
    private String serviceUrl = "http://localhost:5055/verify";
    private int timeoutMillis = 15000;
    private double minScore = 0.7d;

    public boolean isServiceEnabled() {
      return serviceEnabled;
    }

    public void setServiceEnabled(boolean serviceEnabled) {
      this.serviceEnabled = serviceEnabled;
    }

    public String getServiceUrl() {
      return serviceUrl;
    }

    public void setServiceUrl(String serviceUrl) {
      this.serviceUrl = serviceUrl;
    }

    public int getTimeoutMillis() {
      return timeoutMillis;
    }

    public void setTimeoutMillis(int timeoutMillis) {
      this.timeoutMillis = timeoutMillis;
    }

    public double getMinScore() {
      return minScore;
    }

    public void setMinScore(double minScore) {
      this.minScore = minScore;
    }
  }

  public static class Mail {
    private boolean enabled;
    private String from;
    private String hrRecipients;

    public boolean isEnabled() {
      return enabled;
    }

    public void setEnabled(boolean enabled) {
      this.enabled = enabled;
    }

    public String getFrom() {
      return from;
    }

    public void setFrom(String from) {
      this.from = from;
    }

    public String getHrRecipients() {
      return hrRecipients;
    }

    public void setHrRecipients(String hrRecipients) {
      this.hrRecipients = hrRecipients;
    }
  }

  public static class Cors {
    private String allowedOrigins = "http://localhost:5173,http://127.0.0.1:5173";

    public String getAllowedOrigins() {
      return allowedOrigins;
    }

    public void setAllowedOrigins(String allowedOrigins) {
      this.allowedOrigins = allowedOrigins;
    }
  }

  public static class Security {
    private int loginMaxAttempts = 5;
    private int loginLockMinutes = 5;
    private int passwordMinLength = 10;
    private boolean passwordRequireMixedCase = true;
    private boolean passwordRequireDigit = true;
    private boolean passwordRequireSpecial = true;

    public int getLoginMaxAttempts() {
      return loginMaxAttempts;
    }

    public void setLoginMaxAttempts(int loginMaxAttempts) {
      this.loginMaxAttempts = loginMaxAttempts;
    }

    public int getLoginLockMinutes() {
      return loginLockMinutes;
    }

    public void setLoginLockMinutes(int loginLockMinutes) {
      this.loginLockMinutes = loginLockMinutes;
    }

    public int getPasswordMinLength() {
      return passwordMinLength;
    }

    public void setPasswordMinLength(int passwordMinLength) {
      this.passwordMinLength = passwordMinLength;
    }

    public boolean isPasswordRequireMixedCase() {
      return passwordRequireMixedCase;
    }

    public void setPasswordRequireMixedCase(boolean passwordRequireMixedCase) {
      this.passwordRequireMixedCase = passwordRequireMixedCase;
    }

    public boolean isPasswordRequireDigit() {
      return passwordRequireDigit;
    }

    public void setPasswordRequireDigit(boolean passwordRequireDigit) {
      this.passwordRequireDigit = passwordRequireDigit;
    }

    public boolean isPasswordRequireSpecial() {
      return passwordRequireSpecial;
    }

    public void setPasswordRequireSpecial(boolean passwordRequireSpecial) {
      this.passwordRequireSpecial = passwordRequireSpecial;
    }
  }
}
