package com.attendance.repo;

import com.attendance.domain.AttendancePolicyVersion;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface AttendancePolicyVersionRepository extends JpaRepository<AttendancePolicyVersion, Long> {
  List<AttendancePolicyVersion> findTop20ByOrderByEffectiveFromDesc();
}
