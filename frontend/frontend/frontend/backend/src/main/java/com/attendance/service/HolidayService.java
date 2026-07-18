package com.attendance.service;

import com.attendance.domain.Holiday;
import com.attendance.repo.HolidayRepository;
import java.time.LocalDate;
import java.time.YearMonth;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class HolidayService {
  private final HolidayRepository holidayRepository;

  public HolidayService(HolidayRepository holidayRepository) {
    this.holidayRepository = holidayRepository;
  }

  public List<Holiday> listForMonth(YearMonth month) {
    return holidayRepository.findAllByDateBetween(month.atDay(1), month.atEndOfMonth());
  }

  public List<Holiday> listBetween(LocalDate fromInclusive, LocalDate toInclusive) {
    return holidayRepository.findAllByDateBetween(fromInclusive, toInclusive);
  }

  @Transactional
  public Holiday upsert(LocalDate date, String name) {
    Holiday h = holidayRepository.findByDate(date).orElseGet(Holiday::new);
    h.setDate(date);
    h.setName(name);
    return holidayRepository.save(h);
  }

  @Transactional
  public void delete(Long id) {
    if (!holidayRepository.existsById(id)) {
      throw new ApiException(HttpStatus.NOT_FOUND, "Holiday not found");
    }
    holidayRepository.deleteById(id);
  }
}

