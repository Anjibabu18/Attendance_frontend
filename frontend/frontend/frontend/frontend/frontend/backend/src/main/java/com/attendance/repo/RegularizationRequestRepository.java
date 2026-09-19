package com.attendance.repo;

import com.attendance.domain.RegularizationRequest;
import com.attendance.domain.RegularizationStatus;
import java.time.LocalDate;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface RegularizationRequestRepository extends JpaRepository<RegularizationRequest, Long> {
  List<RegularizationRequest> findAllByEmployee_IdOrderByCreatedAtDesc(Long employeeId);
  List<RegularizationRequest> findAllByStatusOrderByCreatedAtDesc(RegularizationStatus status);
  boolean existsByEmployee_IdAndDateAndStatus(Long employeeId, LocalDate date, RegularizationStatus status);
}
