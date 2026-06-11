package com.attendance.api;

import com.attendance.api.dto.RegularizationDtos;
import com.attendance.api.dto.WorkRequestDtos;
import com.attendance.repo.EmployeeRepository;
import com.attendance.service.RegularizationRequestService;
import com.attendance.service.WorkRequestService;
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

  public ManagerController(
      EmployeeRepository employeeRepository,
      RegularizationRequestService regularizationRequestService,
      WorkRequestService workRequestService) {
    this.employeeRepository = employeeRepository;
    this.regularizationRequestService = regularizationRequestService;
    this.workRequestService = workRequestService;
  }

  @GetMapping("/team")
  public Object team() { return employeeRepository.findAll(); }
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
