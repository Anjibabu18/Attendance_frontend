package com.attendance.repo;

import com.attendance.domain.LeaveBalance;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface LeaveBalanceRepository extends JpaRepository<LeaveBalance, Long> {
  List<LeaveBalance> findAllByEmployee_IdAndYear(Long employeeId, int year);
  Optional<LeaveBalance> findByEmployee_IdAndLeaveTypeAndYear(Long employeeId, String leaveType, int year);
}
