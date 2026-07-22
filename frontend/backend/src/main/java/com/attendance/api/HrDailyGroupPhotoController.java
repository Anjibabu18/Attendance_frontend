package com.attendance.api;

import com.attendance.api.dto.DailyPhotoDtos;
import com.attendance.service.DailyGroupPhotoService;
import jakarta.validation.constraints.NotNull;
import java.time.LocalDate;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/api/hr/daily-group-photos")
@PreAuthorize("hasAuthority('ROLE_HR')")
public class HrDailyGroupPhotoController {
  private final DailyGroupPhotoService dailyGroupPhotoService;

  public HrDailyGroupPhotoController(DailyGroupPhotoService dailyGroupPhotoService) {
    this.dailyGroupPhotoService = dailyGroupPhotoService;
  }

  @PostMapping
  public DailyPhotoDtos.DailyPhotoResponse upload(
      @RequestParam("date") @NotNull @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date,
      @RequestParam("file") MultipartFile file) {
    var p = dailyGroupPhotoService.upload(date, file);
    return new DailyPhotoDtos.DailyPhotoResponse(p.getId(), p.getDate(), p.getPhotoUrl());
  }
}
