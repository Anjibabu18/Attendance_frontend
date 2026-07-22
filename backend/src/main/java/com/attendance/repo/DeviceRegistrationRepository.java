package com.attendance.repo;

import com.attendance.domain.DeviceRegistration;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

public interface DeviceRegistrationRepository extends JpaRepository<DeviceRegistration, Long> {
  @Override
  @EntityGraph(attributePaths = "user")
  List<DeviceRegistration> findAll();

  @EntityGraph(attributePaths = "user")
  Optional<DeviceRegistration> findById(Long id);

  List<DeviceRegistration> findAllByUser_UsernameOrderByCreatedAtDesc(String username);
  Optional<DeviceRegistration> findByUser_UsernameAndDeviceId(String username, String deviceId);
}
