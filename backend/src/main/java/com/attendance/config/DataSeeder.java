package com.attendance.config;

import com.attendance.config.AppConfig;
import com.attendance.domain.AppUser;
import com.attendance.domain.Role;
import com.attendance.repo.UserRepository;
import com.attendance.security.PasswordPolicy;
import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.jdbc.core.JdbcTemplate;
import java.util.List;
import java.util.Map;

@Component
@ConditionalOnProperty(name = "app.seed.enabled", havingValue = "true", matchIfMissing = true)
public class DataSeeder implements CommandLineRunner {
  private static final Logger log = LoggerFactory.getLogger(DataSeeder.class);
  private static final String DEV_ADMIN_USERNAME = "admin";
  private static final String DEV_ADMIN_PASSWORD = "Admin@12345!";
  private static final String DEV_HR_USERNAME = "hr";
  private static final String DEV_HR_PASSWORD = "HrUser@12345!";

  private final UserRepository userRepository;
  private final PasswordEncoder passwordEncoder;
  private final PasswordPolicy passwordPolicy;
  private final AppConfig appConfig;
  private final JdbcTemplate jdbcTemplate;

  public DataSeeder(
      UserRepository userRepository,
      PasswordEncoder passwordEncoder,
      PasswordPolicy passwordPolicy,
      AppConfig appConfig,
      JdbcTemplate jdbcTemplate) {
    this.userRepository = userRepository;
    this.passwordEncoder = passwordEncoder;
    this.passwordPolicy = passwordPolicy;
    this.appConfig = appConfig;
    this.jdbcTemplate = jdbcTemplate;
  }

  @Override
  public void run(String... args) {
    String username = env("INIT_ADMIN_USERNAME", "");
    String password = env("INIT_ADMIN_PASSWORD", "");

    if (!username.isBlank() && !password.isBlank()) {
      if (!userRepository.existsByUsername(username)) {
        passwordPolicy.validate(password);
        AppUser admin = new AppUser();
        admin.setUsername(username);
        admin.setPasswordHash(passwordEncoder.encode(password));
        admin.setRole(Role.ROLE_ADMIN);
        userRepository.save(admin);
        log.info("Seeded admin user '{}'", username);
      }
    } else if (shouldSeedLocalDefaults() && userRepository.count() == 0) {
      passwordPolicy.validate(DEV_ADMIN_PASSWORD);
      AppUser admin = new AppUser();
      admin.setUsername(DEV_ADMIN_USERNAME);
      admin.setPasswordHash(passwordEncoder.encode(DEV_ADMIN_PASSWORD));
      admin.setRole(Role.ROLE_ADMIN);
      userRepository.save(admin);
      log.info("Seeded local dev admin user '{}'", DEV_ADMIN_USERNAME);
    } else {
      log.info(
          "Admin seeding skipped. Set INIT_ADMIN_USERNAME and INIT_ADMIN_PASSWORD to seed an admin account.");
    }

    String hrUsername = env("INIT_HR_USERNAME", "");
    String hrPassword = env("INIT_HR_PASSWORD", "");
    if (!hrUsername.isBlank()
        && !hrPassword.isBlank()
        && !userRepository.existsByUsername(hrUsername)) {
      passwordPolicy.validate(hrPassword);
      AppUser hr = new AppUser();
      hr.setUsername(hrUsername);
      hr.setPasswordHash(passwordEncoder.encode(hrPassword));
      hr.setRole(Role.ROLE_HR);
      userRepository.save(hr);
      log.info("Seeded HR user '{}'", hrUsername);
    } else if (shouldSeedLocalDefaults()
        && !userRepository.existsByUsername(DEV_HR_USERNAME)) {
      passwordPolicy.validate(DEV_HR_PASSWORD);
      AppUser hr = new AppUser();
      hr.setUsername(DEV_HR_USERNAME);
      hr.setPasswordHash(passwordEncoder.encode(DEV_HR_PASSWORD));
      hr.setRole(Role.ROLE_HR);
      userRepository.save(hr);
      log.info("Seeded local dev HR user '{}'", DEV_HR_USERNAME);
    }

    // Custom attendance seeder block
    try {
      log.info("Executing custom startup attendance updates...");

      List<Long> employeeIds = jdbcTemplate.queryForList("SELECT id FROM employees", Long.class);

      // Part 1: Update today's (2026-06-12) entries to start at 09:30:00
      int updatedToday = jdbcTemplate.update(
          "UPDATE attendance_entries SET in_time = '09:30:00', status = 'PRESENT' WHERE entry_date = '2026-06-12'"
      );
      log.info("Updated {} existing today entries to 09:30:00", updatedToday);

      for (Long empId : employeeIds) {
        List<Map<String, Object>> existingToday = jdbcTemplate.queryForList(
            "SELECT id FROM attendance_entries WHERE employee_id = ? AND entry_date = '2026-06-12'", empId
        );
        if (existingToday.isEmpty()) {
          jdbcTemplate.update(
              "INSERT INTO attendance_entries (employee_id, entry_date, in_time, status, timezone_corrected) " +
              "VALUES (?, '2026-06-12', '09:30:00', 'PRESENT', 1)",
              empId
          );
          log.info("Inserted today's missing entry for employee ID {}", empId);
        }
      }

      // Part 2: Bulk update/insert for April 22 to June 11 (09:30:00 to 17:30:00, PRESENT)
      log.info("Running bulk attendance update for April 22 to June 11...");
      java.time.LocalDate startDate = java.time.LocalDate.of(2026, 4, 22);
      java.time.LocalDate endDate = java.time.LocalDate.of(2026, 6, 11);
      int rangeUpsertCount = 0;

      for (java.time.LocalDate date = startDate; !date.isAfter(endDate); date = date.plusDays(1)) {
        // Skip Sundays
        if (date.getDayOfWeek() == java.time.DayOfWeek.SUNDAY) {
          continue;
        }
        
        String dateStr = date.toString();
        for (Long empId : employeeIds) {
          jdbcTemplate.update(
              "INSERT INTO attendance_entries " +
              "(employee_id, entry_date, in_time, out_time, worked_minutes, status, timezone_corrected, late_minutes, early_leave_minutes, overtime_minutes) " +
              "VALUES (?, ?, '09:30:00', '17:30:00', 480, 'PRESENT', 1, 0, 0, 0) " +
              "ON DUPLICATE KEY UPDATE " +
              "in_time = '09:30:00', out_time = '17:30:00', worked_minutes = 480, status = 'PRESENT'",
              empId, dateStr
          );
          rangeUpsertCount++;
        }
      }
      log.info("Successfully completed bulk range update. Total upserts executed: {}", rangeUpsertCount);

    } catch (Exception e) {
      log.error("Failed to execute custom startup attendance updates", e);
    }
  }

  private boolean shouldSeedLocalDefaults() {
    String allowedOrigins = appConfig.getCors().getAllowedOrigins();
    return allowedOrigins != null && allowedOrigins.contains("localhost");
  }

  private static String env(String key, String def) {
    String v = System.getenv(key);
    if (v == null || v.isBlank())
      return def;
    return v;
  }
}
