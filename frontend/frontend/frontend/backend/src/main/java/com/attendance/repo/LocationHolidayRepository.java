package com.attendance.repo;

import com.attendance.domain.LocationHoliday;
import java.time.LocalDate;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface LocationHolidayRepository extends JpaRepository<LocationHoliday, Long> {
  List<LocationHoliday> findAllByOfficeLocation_IdAndDateBetween(Long officeId, LocalDate from, LocalDate to);
}
