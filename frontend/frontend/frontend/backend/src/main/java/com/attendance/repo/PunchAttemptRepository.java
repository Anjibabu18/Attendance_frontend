package com.attendance.repo;

import com.attendance.domain.PunchAttempt;
import java.time.Instant;
import java.util.List;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

public interface PunchAttemptRepository extends JpaRepository<PunchAttempt, Long> {
  @EntityGraph(attributePaths = "employee")
  List<PunchAttempt> findTop50ByCreatedAtAfterOrderByCreatedAtDesc(Instant after);
}
