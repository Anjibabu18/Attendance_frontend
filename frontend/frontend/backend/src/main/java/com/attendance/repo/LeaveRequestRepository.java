package com.attendance.repo;

import com.attendance.domain.LeaveRequest;
import com.attendance.domain.LeaveRequestStatus;
import java.time.LocalDate;
import java.util.Collection;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface LeaveRequestRepository extends JpaRepository<LeaveRequest, Long> {
  List<LeaveRequest> findAllByEmployee_IdOrderByCreatedAtDesc(Long employeeId);

  List<LeaveRequest> findAllByStatusOrderByCreatedAtDesc(LeaveRequestStatus status);

  List<LeaveRequest> findAllByStatusInOrderByCreatedAtDesc(Collection<LeaveRequestStatus> statuses);

  boolean existsByEmployee_IdAndStatusInAndFromDateLessThanEqualAndToDateGreaterThanEqual(
      Long employeeId,
      List<LeaveRequestStatus> statuses,
      LocalDate toDate,
      LocalDate fromDate);
}
