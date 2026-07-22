package com.attendance.repo;

import com.attendance.domain.UserSessionRecord;
import java.util.List;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

public interface UserSessionRecordRepository extends JpaRepository<UserSessionRecord, Long> {
  @EntityGraph(attributePaths = "user")
  List<UserSessionRecord> findTop100ByOrderByLoginAtDesc();
}
