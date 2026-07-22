package com.attendance.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

@Entity
@Table(name = "company_profile")
public class CompanyProfile {
  @Id
  private Long id = 1L;

  @Column(length = 500)
  private String groupPhotoUrl;

  @Column(length = 200)
  private String groupPhotoPublicId;

  public Long getId() {
    return id;
  }

  public void setId(Long id) {
    this.id = id;
  }

  public String getGroupPhotoUrl() {
    return groupPhotoUrl;
  }

  public void setGroupPhotoUrl(String groupPhotoUrl) {
    this.groupPhotoUrl = groupPhotoUrl;
  }

  public String getGroupPhotoPublicId() {
    return groupPhotoPublicId;
  }

  public void setGroupPhotoPublicId(String groupPhotoPublicId) {
    this.groupPhotoPublicId = groupPhotoPublicId;
  }
}

