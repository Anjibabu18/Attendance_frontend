package com.attendance.service;

import com.attendance.domain.ShiftRosterAssignment;
import com.attendance.repo.EmployeeRepository;
import com.attendance.repo.ShiftRosterAssignmentRepository;
import com.attendance.repo.WorkShiftRepository;
import java.time.LocalDate;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class RosterService {
  private final ShiftRosterAssignmentRepository rosterRepo;
  private final EmployeeRepository employeeRepo;
  private final WorkShiftRepository shiftRepo;

  public RosterService(ShiftRosterAssignmentRepository rosterRepo, EmployeeRepository employeeRepo, WorkShiftRepository shiftRepo) {
    this.rosterRepo = rosterRepo;
    this.employeeRepo = employeeRepo;
    this.shiftRepo = shiftRepo;
  }

  @Transactional
  public int assign(Long employeeId, Long shiftId, LocalDate fromDate, LocalDate toDate) {
    if (fromDate == null || toDate == null || fromDate.isAfter(toDate)) {
      throw new ApiException(HttpStatus.BAD_REQUEST, "Valid fromDate and toDate are required");
    }
    if (java.time.temporal.ChronoUnit.DAYS.between(fromDate, toDate) > 120) {
      throw new ApiException(HttpStatus.BAD_REQUEST, "Roster range too large");
    }
    var employee = employeeRepo.findById(employeeId).orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Employee not found"));
    var shift = shiftRepo.findById(shiftId).orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Shift not found"));
    int count = 0;
    for (LocalDate d = fromDate; !d.isAfter(toDate); d = d.plusDays(1)) {
      var row = rosterRepo.findByEmployee_IdAndDate(employeeId, d).orElseGet(ShiftRosterAssignment::new);
      row.setEmployee(employee);
      row.setShift(shift);
      row.setDate(d);
      rosterRepo.save(row);
      count++;
    }
    return count;
  }

  public List<ShiftRosterAssignment> list(LocalDate fromDate, LocalDate toDate) {
    return rosterRepo.findAllByDateBetweenOrderByDateAsc(fromDate, toDate);
  }
}
