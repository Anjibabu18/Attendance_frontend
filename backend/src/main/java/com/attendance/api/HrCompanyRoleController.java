package com.attendance.api;

import com.attendance.api.dto.ViewDtos;
import com.attendance.service.CompanyRoleService;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/api/hr/company-roles")
@PreAuthorize("hasAuthority('ROLE_HR')")
public class HrCompanyRoleController {
  private final CompanyRoleService companyRoleService;

  public HrCompanyRoleController(CompanyRoleService companyRoleService) {
    this.companyRoleService = companyRoleService;
  }

  @PostMapping("/{id}/photo")
  public ViewDtos.CompanyRoleView uploadCompanyRolePhoto(
      @PathVariable("id") Long id, @RequestParam("file") MultipartFile file) {
    var r = companyRoleService.uploadRolePhoto(id, file);
    return new ViewDtos.CompanyRoleView(r.getId(), r.getName(), r.getPhotoUrl());
  }
}

