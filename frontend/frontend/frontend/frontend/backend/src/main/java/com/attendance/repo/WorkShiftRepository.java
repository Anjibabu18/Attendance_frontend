package com.attendance.repo;

import com.attendance.domain.WorkShift;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface WorkShiftRepository extends JpaRepository<WorkShift, Long> {
  Optional<WorkShift> findByNameIgnoreCase(String name);
}
