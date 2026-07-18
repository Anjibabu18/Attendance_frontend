package com.attendance.repo;

import com.attendance.domain.PayrollLock;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface PayrollLockRepository extends JpaRepository<PayrollLock, Long> {
  Optional<PayrollLock> findByMonth(String month);
}
