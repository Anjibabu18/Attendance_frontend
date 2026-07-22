package com.attendance.api;

import com.attendance.api.dto.HolidayDtos;
import com.attendance.service.HolidayService;
import jakarta.validation.Valid;
import java.time.YearMonth;
import java.util.List;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/admin/holidays")
@PreAuthorize("hasAuthority('ROLE_ADMIN')")
public class AdminHolidayController {
  private final HolidayService holidayService;

  public AdminHolidayController(HolidayService holidayService) {
    this.holidayService = holidayService;
  }

  @GetMapping
  public List<HolidayDtos.HolidayResponse> list(@RequestParam("month") String month) {
    YearMonth ym = YearMonth.parse(month);
    return holidayService.listForMonth(ym).stream()
        .map(h -> new HolidayDtos.HolidayResponse(h.getId(), h.getDate(), h.getName()))
        .toList();
  }

  @PostMapping
  public HolidayDtos.HolidayResponse upsert(@Valid @RequestBody HolidayDtos.CreateHolidayRequest req) {
    var h = holidayService.upsert(req.getDate(), req.getName());
    return new HolidayDtos.HolidayResponse(h.getId(), h.getDate(), h.getName());
  }

  @DeleteMapping("/{id}")
  public void delete(@PathVariable("id") Long id) {
    holidayService.delete(id);
  }
}

