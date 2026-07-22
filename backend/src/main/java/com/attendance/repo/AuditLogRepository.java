package com.attendance.repo;

import com.attendance.domain.AuditLog;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface AuditLogRepository extends JpaRepository<AuditLog, Long> {
  List<AuditLog> findTop100ByOrderByCreatedAtDesc();
  List<AuditLog> findTop500ByOrderByCreatedAtDesc();
  Optional<AuditLog> findTopByOrderByIdDesc();
}
