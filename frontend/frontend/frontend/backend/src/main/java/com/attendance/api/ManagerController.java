package com.attendance.api;

import com.attendance.api.dto.RegularizationDtos;
import com.attendance.api.dto.WorkRequestDtos;
import com.attendance.repo.EmployeeRepository;
import com.attendance.service.RegularizationRequestService;
import com.attendance.service.WorkRequestService;
import java.time.YearMonth;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.List;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/manager")
@PreAuthorize("hasAuthority('ROLE_MANAGER')")
public class ManagerController {
  private final EmployeeRepository employeeRepository;
  private final RegularizationRequestService regularizationRequestService;
  private final WorkRequestService workRequestService;
  private final com.attendance.service.AttendanceService attendanceService;

  public ManagerController(
      EmployeeRepository employeeRepository,
      RegularizationRequestService regularizationRequestService,
      WorkRequestService workRequestService,
      com.attendance.service.AttendanceService attendanceService) {
    this.employeeRepository = employeeRepository;
    this.regularizationRequestService = regularizationRequestService;
    this.workRequestService = workRequestService;
    this.attendanceService = attendanceService;
  }

  @GetMapping("/team")
  public Object team() { return employeeRepository.findAll(); }
  @GetMapping("/team/attendance")
  public List<Map<String, Object>> teamAttendance(@RequestParam("month") String month) {
    YearMonth ym = YearMonth.parse(month);
    return employeeRepository.findAll().stream().map(employee -> {
      var summary = attendanceService.monthSummary(employee.getId(), ym);
      var today = attendanceService.listForMonth(employee.getId(), ym).stream()
          .filter(entry -> entry.getDate().equals(com.attendance.service.AttendanceClock.today()))
          .findFirst()
          .orElse(null);
      Map<String, Object> row = new LinkedHashMap<>();
      row.put("employeeId", employee.getId());
      row.put("employeeName", employee.getName());
      row.put("employeeNumber", employee.getEmployeeNumber());
      row.put("office", employee.getAssignedOfficeLocation() == null ? "Default office" : employee.getAssignedOfficeLocation().getOfficeName());
      row.put("todayStatus", today == null ? "ABSENT" : today.getStatus().name());
      row.put("inTime", today == null ? null : today.getInTime());
      row.put("outTime", today == null ? null : today.getOutTime());
      row.put("presentDays", summary.presentDays());
      row.put("halfDayDays", summary.halfDayDays());
      row.put("leaveDays", summary.leaveDays());
      row.put("workingDays", summary.workingDays());
      return row;
    }).toList();
  }
  @GetMapping("/regularization-requests/pending")
  public Object pendingCorrections() { return regularizationRequestService.listPending(); }
  @PostMapping("/regularization-requests/{id}/recommend")
  public Map<String, Object> recommend(@PathVariable Long id, @RequestBody(required = false) RegularizationDtos.DecideRegularizationRequest req) {
    return Map.of("id", id, "managerRecommendation", true, "remarks", req == null ? "" : req.getRemarks());
  }

  @GetMapping("/work-requests/pending")
  public List<WorkRequestDtos.WorkRequestResponse> pendingWorkRequests() {
    return workRequestService.listPendingForManager().stream().map(ManagerController::toWorkRequestResponse).toList();
  }

  @PostMapping("/work-requests/{id}/recommend")
  public WorkRequestDtos.WorkRequestResponse recommendWorkRequest(
      @PathVariable Long id, @RequestBody(required = false) WorkRequestDtos.DecideWorkRequest req) {
    String username = (String) SecurityContextHolder.getContext().getAuthentication().getPrincipal();
    return toWorkRequestResponse(workRequestService.recommend(id, username, req == null ? null : req.getRemarks()));
  }

  @PostMapping("/work-requests/{id}/reject")
  public WorkRequestDtos.WorkRequestResponse rejectWorkRequest(
      @PathVariable Long id, @RequestBody(required = false) WorkRequestDtos.DecideWorkRequest req) {
    String username = (String) SecurityContextHolder.getContext().getAuthentication().getPrincipal();
    return toWorkRequestResponse(workRequestService.reject(id, username, req == null ? null : req.getRemarks()));
  }

  private static WorkRequestDtos.WorkRequestResponse toWorkRequestResponse(com.attendance.domain.WorkRequest r) {
    var e = r.getEmployee();
    var decidedBy = r.getDecidedBy() == null ? null : r.getDecidedBy().getUsername();
    return new WorkRequestDtos.WorkRequestResponse(
        r.getId(), e.getId(), e.getName(), e.getEmployeeNumber(), r.getType(), r.getFromDate(), r.getToDate(), r.getReason(), r.getStatus(), r.getCreatedAt(), r.getDecidedAt(), decidedBy, r.getRemarks(), r.getAttachmentUrl(), r.getAttachmentName());
  }
}



