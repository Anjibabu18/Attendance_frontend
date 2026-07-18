package com.attendance.service;

import com.attendance.domain.CompanyProfile;
import com.attendance.repo.CompanyProfileRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

@Service
public class CompanyProfileService {
  private static final long SINGLETON_ID = 1L;

  private final CompanyProfileRepository companyProfileRepository;
  private final CloudinaryService cloudinaryService;

  public CompanyProfileService(
      CompanyProfileRepository companyProfileRepository, CloudinaryService cloudinaryService) {
    this.companyProfileRepository = companyProfileRepository;
    this.cloudinaryService = cloudinaryService;
  }

  @Transactional
  public CompanyProfile get() {
    return companyProfileRepository.findById(SINGLETON_ID).orElseGet(this::createDefault);
  }

  @Transactional
  public CompanyProfile uploadGroupPhoto(MultipartFile file) {
    CompanyProfile p =
        companyProfileRepository.findById(SINGLETON_ID).orElseGet(CompanyProfile::new);
    p.setId(SINGLETON_ID);
    var res = cloudinaryService.uploadGroupPhoto(file, "company_group");
    p.setGroupPhotoUrl(res.url());
    p.setGroupPhotoPublicId(res.publicId());
    return companyProfileRepository.save(p);
  }

  @Transactional
  protected CompanyProfile createDefault() {
    CompanyProfile p = new CompanyProfile();
    p.setId(SINGLETON_ID);
    return companyProfileRepository.save(p);
  }
}

