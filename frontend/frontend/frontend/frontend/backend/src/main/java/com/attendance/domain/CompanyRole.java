package com.attendance.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;

@Entity
@Table(
    name = "company_roles",
    uniqueConstraints = {@UniqueConstraint(name = "uk_company_roles_name", columnNames = {"name"})})
public class CompanyRole {
  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  private Long id;

  @Column(nullable = false, length = 120)
  private String name;

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

  public String getName() {
    return name;
  }

  public void setName(String name) {
    this.name = name;
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

