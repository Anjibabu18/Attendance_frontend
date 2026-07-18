package com.attendance.repo;

import com.attendance.domain.DailyGroupPhoto;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface DailyGroupPhotoRepository extends JpaRepository<DailyGroupPhoto, Long> {
  Optional<DailyGroupPhoto> findByDate(LocalDate date);
  List<DailyGroupPhoto> findAllByDateBetween(LocalDate fromInclusive, LocalDate toInclusive);
}

