package com.attendance.repo;

import com.attendance.domain.CompOffRequest;
import com.attendance.domain.CompOffRequestStatus;
import java.util.List;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

public interface CompOffRequestRepository extends JpaRepository<CompOffRequest, Long> {
  @EntityGraph(attributePaths = {"employee", "employee.user", "decidedBy"})
  List<CompOffRequest> findAllByEmployee_IdOrderByCreatedAtDesc(Long employeeId);
  @EntityGraph(attributePaths = {"employee", "employee.user", "decidedBy"})
  List<CompOffRequest> findAllByStatusOrderByCreatedAtDesc(CompOffRequestStatus status);
}
