package com.attendance.api.dto;

import java.time.Instant;

public class BreakDtos {
  public static class BreakResponse {
    private final Long id;
    private final Instant start;
    private final Instant end;
    public BreakResponse(Long id, Instant start, Instant end) { this.id = id; this.start = start; this.end = end; }
    public Long getId() { return id; }
    public Instant getStart() { return start; }
    public Instant getEnd() { return end; }
  }
}
