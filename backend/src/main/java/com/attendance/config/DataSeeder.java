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

    // Custom attendance seeder block for today's entries
    try {
      log.info("Executing custom startup attendance update query for today's entries (9:30 AM)...");
      
      // Update existing entries for today (2026-06-12) to have in_time = 09:30:00
      int updated = jdbcTemplate.update(
          "UPDATE attendance_entries SET in_time = '09:30:00', status = 'PRESENT' WHERE entry_date = '2026-06-12'"
      );
      log.info("Updated {} existing attendance entries to 09:30:00 for 2026-06-12", updated);

      // Insert missing attendance entries for all employees for 2026-06-12
      List<Long> employeeIds = jdbcTemplate.queryForList("SELECT id FROM employees", Long.class);
      for (Long empId : employeeIds) {
        List<Map<String, Object>> existing = jdbcTemplate.queryForList(
            "SELECT id FROM attendance_entries WHERE employee_id = ? AND entry_date = '2026-06-12'", empId
        );
        if (existing.isEmpty()) {
          jdbcTemplate.update(
              "INSERT INTO attendance_entries (employee_id, entry_date, in_time, status, timezone_corrected) " +
              "VALUES (?, '2026-06-12', '09:30:00', 'PRESENT', 1)",
              empId
          );
          log.info("Inserted missing 09:30:00 attendance entry for employee ID {} on 2026-06-12", empId);
        }
      }
    } catch (Exception e) {
      log.error("Failed to execute custom startup attendance update query", e);
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
