package com.attendance.api;

import com.attendance.api.dto.DailyPhotoDtos;
import com.attendance.service.DailyGroupPhotoService;
import java.time.YearMonth;
import java.util.List;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/daily-group-photos")
@PreAuthorize("isAuthenticated()")
public class DailyGroupPhotoController {
  private final DailyGroupPhotoService dailyGroupPhotoService;

  public DailyGroupPhotoController(DailyGroupPhotoService dailyGroupPhotoService) {
    this.dailyGroupPhotoService = dailyGroupPhotoService;
  }

  @GetMapping
  public List<DailyPhotoDtos.DailyPhotoResponse> list(@RequestParam("month") String month) {
    YearMonth ym = YearMonth.parse(month);
    return dailyGroupPhotoService.listForMonth(ym).stream()
        .map(p -> new DailyPhotoDtos.DailyPhotoResponse(p.getId(), p.getDate(), p.getPhotoUrl()))
        .toList();
  }
}

