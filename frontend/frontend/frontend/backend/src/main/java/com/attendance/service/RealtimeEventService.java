package com.attendance.service;

import java.io.IOException;
import java.time.Instant;
import java.util.Map;
import java.util.concurrent.CopyOnWriteArrayList;
import org.springframework.stereotype.Service;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

@Service
public class RealtimeEventService {
  private final CopyOnWriteArrayList<SseEmitter> emitters = new CopyOnWriteArrayList<>();

  public SseEmitter subscribe() {
    SseEmitter emitter = new SseEmitter(30L * 60L * 1000L);
    emitters.add(emitter);
    emitter.onCompletion(() -> emitters.remove(emitter));
    emitter.onTimeout(() -> emitters.remove(emitter));
    emitter.onError(e -> emitters.remove(emitter));
    return emitter;
  }

  public void publishAttendanceChanged(String type, String employeeName) {
    publish(
        "attendance-change",
        Map.of(
            "type", type,
            "employeeName", employeeName == null ? "--" : employeeName,
            "at", Instant.now()));
  }

  private void publish(String eventName, Object data) {
    for (SseEmitter emitter : emitters) {
      try {
        emitter.send(SseEmitter.event().name(eventName).data(data));
      } catch (IOException | IllegalStateException e) {
        emitters.remove(emitter);
      }
    }
  }
}
