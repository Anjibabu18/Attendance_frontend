package com.attendance.api;

import com.attendance.service.RealtimeAttendanceService;
import com.attendance.service.RealtimeEventService;
import java.time.YearMonth;
import java.util.Map;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

@RestController
@RequestMapping("/api/realtime")
@PreAuthorize("hasAnyAuthority('ROLE_ADMIN','ROLE_HR')")
public class RealtimeController {
  private final RealtimeAttendanceService realtimeAttendanceService;
  private final RealtimeEventService realtimeEventService;

  public RealtimeController(
      RealtimeAttendanceService realtimeAttendanceService,
      RealtimeEventService realtimeEventService) {
    this.realtimeAttendanceService = realtimeAttendanceService;
    this.realtimeEventService = realtimeEventService;
  }

  @GetMapping("/board")
  public Map<String, Object> board() {
    return realtimeAttendanceService.board();
  }

  @GetMapping("/events")
  public SseEmitter events() throws Exception {
    SseEmitter emitter = realtimeEventService.subscribe();
    emitter.send(SseEmitter.event().name("board").data(realtimeAttendanceService.board()));
    return emitter;
  }

  @GetMapping("/payroll.csv")
  public ResponseEntity<String> payroll(@RequestParam("month") String month) {
    YearMonth ym = YearMonth.parse(month);
    return ResponseEntity.ok()
        .contentType(new MediaType("text", "csv"))
        .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"payroll-attendance-" + ym + ".csv\"")
        .body(realtimeAttendanceService.payrollCsv(ym));
  }

  @GetMapping("/payroll-preview")
  public Map<String, Object> payrollPreview(@RequestParam("month") String month) {
    return realtimeAttendanceService.payrollPreview(YearMonth.parse(month));
  }
}
