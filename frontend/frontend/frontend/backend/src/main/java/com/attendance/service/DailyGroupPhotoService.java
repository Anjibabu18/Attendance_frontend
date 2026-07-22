package com.attendance.service;

import com.attendance.domain.DailyGroupPhoto;
import com.attendance.repo.DailyGroupPhotoRepository;
import java.time.LocalDate;
import java.time.YearMonth;
import java.util.List;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

@Service
public class DailyGroupPhotoService {
  private final DailyGroupPhotoRepository dailyGroupPhotoRepository;
  private final CloudinaryService cloudinaryService;

  public DailyGroupPhotoService(
      DailyGroupPhotoRepository dailyGroupPhotoRepository, CloudinaryService cloudinaryService) {
    this.dailyGroupPhotoRepository = dailyGroupPhotoRepository;
    this.cloudinaryService = cloudinaryService;
  }

  public List<DailyGroupPhoto> listForMonth(YearMonth month) {
    return dailyGroupPhotoRepository.findAllByDateBetween(month.atDay(1), month.atEndOfMonth());
  }

  @Transactional
  public DailyGroupPhoto upload(LocalDate date, MultipartFile file) {
    DailyGroupPhoto p = dailyGroupPhotoRepository.findByDate(date).orElseGet(DailyGroupPhoto::new);
    p.setDate(date);
    String publicId = "daily_" + date;
    var res = cloudinaryService.uploadDailyGroupPhoto(file, publicId);
    p.setPhotoUrl(res.url());
    p.setPhotoPublicId(res.publicId());
    return dailyGroupPhotoRepository.save(p);
  }
}

