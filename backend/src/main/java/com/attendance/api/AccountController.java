package com.attendance.api;

import com.attendance.api.dto.AccountDtos;
import com.attendance.service.UserService;
import jakarta.validation.Valid;
import java.util.Map;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/account")
public class AccountController {
  private final UserService userService;

  public AccountController(UserService userService) {
    this.userService = userService;
  }

  @PostMapping("/password")
  public Map<String, Object> changePassword(@Valid @RequestBody AccountDtos.ChangePasswordRequest req) {
    String username = (String) SecurityContextHolder.getContext().getAuthentication().getPrincipal();
    userService.changePassword(username, req.getCurrentPassword(), req.getNewPassword());
    return Map.of("ok", true);
  }
}
