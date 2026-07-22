package com.attendance.service;

import com.attendance.config.AppConfig;
import java.util.LinkedHashMap;
import java.util.Map;
import org.springframework.stereotype.Service;

@Service
public class ProductionChecklistService {
  private final AppConfig appConfig;

  public ProductionChecklistService(AppConfig appConfig) {
    this.appConfig = appConfig;
  }

  public Map<String, Object> status() {
    Map<String, Object> out = new LinkedHashMap<>();
    String jwt = appConfig.getJwt().getSecret();
    out.put("jwtSecretStrong", jwt != null && jwt.length() >= 32 && !jwt.contains("change-me"));
    out.put("corsConfigured", appConfig.getCors().getAllowedOrigins() != null && !appConfig.getCors().getAllowedOrigins().contains("*"));
    out.put("smtpConfigured", appConfig.getMail().isEnabled());
    out.put("cloudinaryConfigured", notBlank(appConfig.getCloudinary().getCloudName()) && notBlank(appConfig.getCloudinary().getApiKey()) && notBlank(appConfig.getCloudinary().getApiSecret()));
    out.put("passwordPolicyEnabled", appConfig.getSecurity().getPasswordMinLength() >= 10);
    return out;
  }

  private static boolean notBlank(String s) {
    return s != null && !s.isBlank();
  }
}
