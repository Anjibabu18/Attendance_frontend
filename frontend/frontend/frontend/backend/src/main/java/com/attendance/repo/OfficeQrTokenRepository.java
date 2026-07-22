package com.attendance.repo;

import com.attendance.domain.OfficeQrToken;
import java.util.Optional;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

public interface OfficeQrTokenRepository extends JpaRepository<OfficeQrToken, Long> {
  @EntityGraph(attributePaths = "officeLocation")
  Optional<OfficeQrToken> findByToken(String token);

  @EntityGraph(attributePaths = "officeLocation")
  Optional<OfficeQrToken> findTopByOfficeLocation_IdOrderByCreatedAtDesc(Long officeId);

  @EntityGraph(attributePaths = "officeLocation")
  Optional<OfficeQrToken> findTopByOrderByCreatedAtDesc();
}
