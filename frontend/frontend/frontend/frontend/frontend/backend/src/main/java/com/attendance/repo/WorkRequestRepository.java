package com.attendance.repo;

import com.attendance.domain.WorkRequest;
import com.attendance.domain.WorkRequestStatus;
import java.time.LocalDate;
import java.util.Collection;
import java.util.List;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

public interface WorkRequestRepository extends JpaRepository<WorkRequest, Long> {
  @EntityGraph(attributePaths = {"employee", "employee.user", "decidedBy"})
  List<WorkRequest> findAllByEmployee_IdOrderByCreatedAtDesc(Long employeeId);

  @EntityGraph(attributePaths = {"employee", "employee.user", "decidedBy"})
  List<WorkRequest> findAllByStatusInOrderByCreatedAtDesc(Collection<WorkRequestStatus> statuses);

  boolean existsByEmployee_IdAndStatusInAndFromDateLessThanEqualAndToDateGreaterThanEqual(
      Long employeeId, Collection<WorkRequestStatus> statuses, LocalDate toDate, LocalDate fromDate);
}
