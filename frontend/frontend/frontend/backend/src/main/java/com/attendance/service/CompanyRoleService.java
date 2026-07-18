package com.attendance.service;

import com.attendance.domain.CompanyRole;
import com.attendance.repo.CompanyRoleRepository;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

@Service
public class CompanyRoleService {
  private final CompanyRoleRepository companyRoleRepository;
  private final CloudinaryService cloudinaryService;

  public CompanyRoleService(
      CompanyRoleRepository companyRoleRepository, CloudinaryService cloudinaryService) {
    this.companyRoleRepository = companyRoleRepository;
    this.cloudinaryService = cloudinaryService;
  }

  @Transactional
  public CompanyRole createRole(String name) {
    CompanyRole role = new CompanyRole();
    role.setName(name);
    return companyRoleRepository.save(role);
  }

  public List<CompanyRole> listRoles() {
    return companyRoleRepository.findAll();
  }

  @Transactional
  public CompanyRole uploadRolePhoto(Long roleId, MultipartFile file) {
    CompanyRole role =
        companyRoleRepository
            .findById(roleId)
            .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Company role not found"));
    String publicId = "company_role_" + roleId;
    var res = cloudinaryService.uploadGroupPhoto(file, publicId);
    role.setPhotoUrl(res.url());
    role.setPhotoPublicId(res.publicId());
    return companyRoleRepository.save(role);
  }
}

