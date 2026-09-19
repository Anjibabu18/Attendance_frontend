package com.attendance.api;

import com.attendance.api.dto.HolidayDtos;
import com.attendance.service.HolidayService;
import java.time.YearMonth;
import java.util.List;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/holidays")
@PreAuthorize("isAuthenticated()")
public class HolidayController {
  private final HolidayService holidayService;

  public HolidayController(HolidayService holidayService) {
    this.holidayService = holidayService;
  }

  @GetMapping
  public List<HolidayDtos.HolidayResponse> list(@RequestParam("month") String month) {
    YearMonth ym = YearMonth.parse(month);
    return holidayService.listForMonth(ym).stream()
        .map(h -> new HolidayDtos.HolidayResponse(h.getId(), h.getDate(), h.getName()))
        .toList();
  }
}

