package com.attendance.api.dto;

import java.time.LocalDate;

public class DailyPhotoDtos {
  public static class DailyPhotoResponse {
    private Long id;
    private LocalDate date;
    private String photoUrl;

    public DailyPhotoResponse(Long id, LocalDate date, String photoUrl) {
      this.id = id;
      this.date = date;
      this.photoUrl = photoUrl;
    }

    public Long getId() {
      return id;
    }

    public LocalDate getDate() {
      return date;
    }

    public String getPhotoUrl() {
      return photoUrl;
    }
  }
}

