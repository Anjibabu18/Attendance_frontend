package com.attendance.service;

import com.attendance.repo.CompanyRoleRepository;
import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.nio.charset.StandardCharsets;
import java.time.LocalDate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

@Service
public class BulkEmployeeImportService {
  private final UserService userService;
  private final CompanyRoleRepository companyRoleRepository;

  public BulkEmployeeImportService(UserService userService, CompanyRoleRepository companyRoleRepository) {
    this.userService = userService;
    this.companyRoleRepository = companyRoleRepository;
  }

  @Transactional
  public int importCsv(MultipartFile file) {
    try (BufferedReader br = new BufferedReader(new InputStreamReader(file.getInputStream(), StandardCharsets.UTF_8))) {
      Long defaultRoleId =
          companyRoleRepository.findAll().stream().findFirst().map(r -> r.getId()).orElseThrow(() -> new ApiException(org.springframework.http.HttpStatus.BAD_REQUEST, "Create at least one company role before import"));
      int created = 0;
      String line;
      boolean first = true;
      while ((line = br.readLine()) != null) {
        if (first && line.toLowerCase().contains("employee")) {
          first = false;
          continue;
        }
        first = false;
        String[] p = line.split(",", -1);
        if (p.length < 4) continue;
        String empNo = p[0].trim();
        String name = p[1].trim();
        String username = p[2].trim();
        String password = p[3].trim();
        if (empNo.isBlank() || name.isBlank() || username.isBlank() || password.isBlank()) continue;
        Long roleId = p.length > 4 && !p[4].trim().isBlank() ? Long.valueOf(p[4].trim()) : defaultRoleId;
        userService.createEmployee(empNo, name, username, password, roleId, null, null, null, AttendanceClock.today());
        created++;
      }
      return created;
    } catch (ApiException e) {
      throw e;
    } catch (Exception e) {
      throw new ApiException(org.springframework.http.HttpStatus.BAD_REQUEST, "Invalid CSV upload");
    }
  }
}
