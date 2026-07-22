package com.attendance.domain;

import jakarta.persistence.*;
import java.time.LocalDate;

@Entity
@Table(name = "location_holidays")
public class LocationHoliday {
  @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
  private Long id;
  @ManyToOne(fetch = FetchType.LAZY, optional = false) @JoinColumn(name = "office_id", nullable = false)
  private OfficeLocation officeLocation;
  @Column(nullable = false)
  private LocalDate date;
  @Column(nullable = false, length = 120)
  private String name;
  public Long getId() { return id; }
  public OfficeLocation getOfficeLocation() { return officeLocation; }
  public void setOfficeLocation(OfficeLocation officeLocation) { this.officeLocation = officeLocation; }
  public LocalDate getDate() { return date; }
  public void setDate(LocalDate date) { this.date = date; }
  public String getName() { return name; }
  public void setName(String name) { this.name = name; }
}
