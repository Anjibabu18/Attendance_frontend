package com.attendance.repo;

import com.attendance.domain.OfficeLocation;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface OfficeLocationRepository extends JpaRepository<OfficeLocation, Long> {
  Optional<OfficeLocation> findFirstByActiveTrueOrderByUpdatedAtDesc();

  List<OfficeLocation> findByActiveTrueOrderByOfficeNameAscUpdatedAtDesc();
}
