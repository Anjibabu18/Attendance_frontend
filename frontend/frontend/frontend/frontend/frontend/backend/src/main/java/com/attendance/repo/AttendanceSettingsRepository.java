package com.attendance.repo;

import com.attendance.domain.AttendanceSettings;
import org.springframework.data.jpa.repository.JpaRepository;

public interface AttendanceSettingsRepository extends JpaRepository<AttendanceSettings, Long> {}

