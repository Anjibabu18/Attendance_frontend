package com.attendance.repo;

import com.attendance.domain.AppNotification;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface NotificationRepository extends JpaRepository<AppNotification, Long> {
  List<AppNotification> findTop20ByUser_UsernameOrderByCreatedAtDesc(String username);
  List<AppNotification> findAllByUser_UsernameAndReadFlagFalse(String username);
}
