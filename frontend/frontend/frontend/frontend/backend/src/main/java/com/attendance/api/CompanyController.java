package com.attendance.api;

import com.attendance.api.dto.CompanyDtos;
import com.attendance.service.CompanyProfileService;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/company")
@PreAuthorize("isAuthenticated()")
public class CompanyController {
  private final CompanyProfileService companyProfileService;

  public CompanyController(CompanyProfileService companyProfileService) {
    this.companyProfileService = companyProfileService;
  }

  @GetMapping
  public CompanyDtos.CompanyProfileResponse get() {
    var p = companyProfileService.get();
    return new CompanyDtos.CompanyProfileResponse(p.getGroupPhotoUrl());
  }
}

