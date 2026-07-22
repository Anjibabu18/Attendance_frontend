package com.attendance.service;

import com.attendance.domain.PayrollLock;
import com.attendance.repo.PayrollLockRepository;
import java.time.Instant;
import java.time.YearMonth;
import java.util.LinkedHashMap;
import java.util.Map;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class PayrollLockService {
  private final PayrollLockRepository repository;

  public PayrollLockService(PayrollLockRepository repository) {
    this.repository = repository;
  }

  public boolean isLocked(YearMonth month) {
    return repository.findByMonth(month.toString()).map(PayrollLock::isLocked).orElse(false);
  }

  public void assertUnlocked(YearMonth month) {
    if (isLocked(month)) {
      throw new ApiException(HttpStatus.CONFLICT, "Payroll is locked for " + month + ". Unlock it before changing attendance.");
    }
  }

  @Transactional
  public PayrollLock setLocked(YearMonth month, boolean locked, String actor) {
    PayrollLock lock = repository.findByMonth(month.toString()).orElseGet(PayrollLock::new);
    lock.setMonth(month.toString());
    lock.setLocked(locked);
    lock.setUpdatedAt(Instant.now());
    lock.setUpdatedBy(actor);
    return repository.save(lock);
  }

  public Map<String, Object> view(YearMonth month) {
    PayrollLock lock = repository.findByMonth(month.toString()).orElse(null);
    Map<String, Object> out = new LinkedHashMap<>();
    out.put("month", month.toString());
    out.put("locked", lock != null && lock.isLocked());
    out.put("updatedAt", lock == null ? null : lock.getUpdatedAt());
    out.put("updatedBy", lock == null ? null : lock.getUpdatedBy());
    return out;
  }
}
