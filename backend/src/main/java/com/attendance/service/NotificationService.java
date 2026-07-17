package com.attendance.service;

import com.attendance.domain.AppNotification;
import com.attendance.domain.AppUser;
import com.attendance.repo.NotificationRepository;
import com.attendance.repo.UserRepository;
import java.time.Instant;
import java.util.List;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class NotificationService {
  private final NotificationRepository notificationRepository;
  private final UserRepository userRepository;

  public NotificationService(NotificationRepository notificationRepository, UserRepository userRepository) {
    this.notificationRepository = notificationRepository;
    this.userRepository = userRepository;
  }

  public List<AppNotification> latest(String username) {
    return notificationRepository.findTop20ByUser_UsernameOrderByCreatedAtDesc(username);
  }

  @Transactional
  public void markAllRead(String username) {
    List<AppNotification> unread = notificationRepository.findAllByUser_UsernameAndReadFlagFalse(username);
    unread.forEach(n -> n.setReadFlag(true));
    notificationRepository.saveAll(unread);
  }

  @Transactional
  public void notify(AppUser user, String title, String message) {
    if (user == null) return;
    AppNotification n = new AppNotification();
    n.setUser(user);
    n.setTitle(title);
    n.setMessage(message);
    n.setReadFlag(false);
    n.setCreatedAt(Instant.now());
    notificationRepository.save(n);
  }

  @Transactional
  public void notifyUsername(String username, String title, String message) {
    userRepository.findByUsername(username).ifPresent(u -> notify(u, title, message));
  }
}
