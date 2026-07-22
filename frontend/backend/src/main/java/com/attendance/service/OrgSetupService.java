package com.attendance.service;

import com.attendance.domain.Department;
import com.attendance.domain.WorkShift;
import com.attendance.repo.DepartmentRepository;
import com.attendance.repo.WorkShiftRepository;
import java.time.LocalTime;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class OrgSetupService {
  private final DepartmentRepository departmentRepository;
  private final WorkShiftRepository workShiftRepository;

  public OrgSetupService(DepartmentRepository departmentRepository, WorkShiftRepository workShiftRepository) {
    this.departmentRepository = departmentRepository;
    this.workShiftRepository = workShiftRepository;
  }

  public List<Department> departments() { return departmentRepository.findAll(); }
  public List<WorkShift> shifts() { return workShiftRepository.findAll(); }

  @Transactional
  public Department createDepartment(String name) {
    String n = name == null ? "" : name.trim();
    if (n.isBlank()) throw new ApiException(HttpStatus.BAD_REQUEST, "Department name is required");
    departmentRepository.findByNameIgnoreCase(n).ifPresent(d -> { throw new ApiException(HttpStatus.CONFLICT, "Department already exists"); });
    Department d = new Department();
    d.setName(n);
    return departmentRepository.save(d);
  }

  @Transactional
  public WorkShift createShift(String name, LocalTime inTime, LocalTime outTime, boolean flexible) {
    String n = name == null ? "" : name.trim();
    if (n.isBlank() || inTime == null || outTime == null) throw new ApiException(HttpStatus.BAD_REQUEST, "Shift name, in time, and out time are required");
    workShiftRepository.findByNameIgnoreCase(n).ifPresent(s -> { throw new ApiException(HttpStatus.CONFLICT, "Shift already exists"); });
    WorkShift s = new WorkShift();
    s.setName(n);
    s.setInTime(inTime);
    s.setOutTime(outTime);
    s.setFlexible(flexible);
    return workShiftRepository.save(s);
  }
}
