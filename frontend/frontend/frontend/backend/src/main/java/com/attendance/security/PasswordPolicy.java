package com.attendance.security;

import com.attendance.config.AppConfig;
import com.attendance.service.ApiException;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;

@Component
public class PasswordPolicy {
  private final AppConfig appConfig;

  public PasswordPolicy(AppConfig appConfig) {
    this.appConfig = appConfig;
  }

  public void validate(String password) {
    int minLength = Math.max(8, appConfig.getSecurity().getPasswordMinLength());
    if (password == null || password.length() < minLength) {
      throw new ApiException(
          HttpStatus.BAD_REQUEST, "Password must be at least " + minLength + " characters");
    }
    if (appConfig.getSecurity().isPasswordRequireMixedCase()
        && (!password.chars().anyMatch(Character::isUpperCase)
            || !password.chars().anyMatch(Character::isLowerCase))) {
      throw new ApiException(
          HttpStatus.BAD_REQUEST, "Password must include uppercase and lowercase letters");
    }
    if (appConfig.getSecurity().isPasswordRequireDigit()
        && password.chars().noneMatch(Character::isDigit)) {
      throw new ApiException(HttpStatus.BAD_REQUEST, "Password must include a number");
    }
    if (appConfig.getSecurity().isPasswordRequireSpecial()
        && password.chars().noneMatch(ch -> !Character.isLetterOrDigit(ch))) {
      throw new ApiException(HttpStatus.BAD_REQUEST, "Password must include a special character");
    }
  }
}
