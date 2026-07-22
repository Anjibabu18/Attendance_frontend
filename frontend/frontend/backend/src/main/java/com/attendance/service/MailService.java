package com.attendance.service;

import com.attendance.config.AppConfig;
import com.attendance.domain.AppUser;
import com.attendance.domain.Role;
import com.attendance.repo.UserRepository;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

@Service
public class MailService {
  private static final org.slf4j.Logger log = org.slf4j.LoggerFactory.getLogger(MailService.class);

  private final AppConfig appConfig;
  private final JavaMailSender mailSender;
  private final UserRepository userRepository;

  public MailService(AppConfig appConfig, JavaMailSender mailSender, UserRepository userRepository) {
    this.appConfig = appConfig;
    this.mailSender = mailSender;
    this.userRepository = userRepository;
  }

  public void notifyHr(String subject, String body) {
    send(subject, body, hrRecipients());
  }

  public void notifyUser(String to, String subject, String body) {
    if (to == null || to.trim().isBlank()) return;
    send(subject, body, List.of(to.trim()));
  }

  private void send(String subject, String body, List<String> to) {
    if (!appConfig.getMail().isEnabled()) return;
    if (to == null || to.isEmpty()) return;

    try {
      SimpleMailMessage msg = new SimpleMailMessage();
      msg.setFrom(appConfig.getMail().getFrom());
      msg.setTo(to.toArray(new String[0]));
      msg.setSubject(subject);
      msg.setText(body);
      mailSender.send(msg);
    } catch (RuntimeException ex) {
      log.warn("Mail send failed for subject '{}' to {}", subject, to, ex);
    }
  }

  private List<String> hrRecipients() {
    String override = appConfig.getMail().getHrRecipients();
    if (override != null && !override.trim().isBlank()) {
      return splitEmails(override);
    }
    List<AppUser> hrs = userRepository.findAllByRole(Role.ROLE_HR);
    List<String> emails = new ArrayList<>();
    for (AppUser hr : hrs) {
      String u = hr.getUsername();
      if (looksLikeEmail(u)) emails.add(u.trim());
    }
    return emails;
  }

  private static boolean looksLikeEmail(String value) {
    if (value == null) return false;
    String v = value.trim().toLowerCase(Locale.ROOT);
    return v.contains("@") && !v.startsWith("@") && !v.endsWith("@");
  }

  private static List<String> splitEmails(String csv) {
    List<String> out = new ArrayList<>();
    for (String part : csv.split(",")) {
      String p = part.trim();
      if (p.isBlank()) continue;
      out.add(p);
    }
    return out;
  }
}

