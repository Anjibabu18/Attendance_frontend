package com.attendance.repo;

import com.attendance.domain.Holiday;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface HolidayRepository extends JpaRepository<Holiday, Long> {
  Optional<Holiday> findByDate(LocalDate date);
  List<Holiday> findAllByDateBetween(LocalDate fromInclusive, LocalDate toInclusive);
}

