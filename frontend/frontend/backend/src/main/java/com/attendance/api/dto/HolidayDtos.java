package com.attendance.api.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.time.LocalDate;

public class HolidayDtos {
  public static class CreateHolidayRequest {
    @NotNull private LocalDate date;
    @NotBlank private String name;

    public LocalDate getDate() {
      return date;
    }

    public void setDate(LocalDate date) {
      this.date = date;
    }

    public String getName() {
      return name;
    }

    public void setName(String name) {
      this.name = name;
    }
  }

  public static class HolidayResponse {
    private Long id;
    private LocalDate date;
    private String name;

    public HolidayResponse(Long id, LocalDate date, String name) {
      this.id = id;
      this.date = date;
      this.name = name;
    }

    public Long getId() {
      return id;
    }

    public LocalDate getDate() {
      return date;
    }

    public String getName() {
      return name;
    }
  }
}

