package com.attendance.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
import java.time.LocalDate;

@Entity
@Table(
    name = "daily_group_photos",
    uniqueConstraints = {@UniqueConstraint(name = "uk_daily_group_photos_date", columnNames = {"photo_date"})})
public class DailyGroupPhoto {
  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  private Long id;

  @Column(name = "photo_date", nullable = false)
  private LocalDate date;

  @Column(length = 500)
  private String photoUrl;

  @Column(length = 200)
  private String photoPublicId;

  public Long getId() {
    return id;
  }

  public void setId(Long id) {
    this.id = id;
  }

  public LocalDate getDate() {
    return date;
  }

  public void setDate(LocalDate date) {
    this.date = date;
  }

  public String getPhotoUrl() {
    return photoUrl;
  }

  public void setPhotoUrl(String photoUrl) {
    this.photoUrl = photoUrl;
  }

  public String getPhotoPublicId() {
    return photoPublicId;
  }

  public void setPhotoPublicId(String photoPublicId) {
    this.photoPublicId = photoPublicId;
  }
}

