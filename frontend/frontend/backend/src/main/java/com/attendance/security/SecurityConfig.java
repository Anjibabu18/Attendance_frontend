package com.attendance.security;

import com.attendance.config.AppConfig;
import jakarta.servlet.RequestDispatcher;
import java.util.Arrays;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.Customizer;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.ProviderManager;
import org.springframework.security.authentication.dao.DaoAuthenticationProvider;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;
import org.springframework.http.HttpStatus;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

@Configuration
@EnableMethodSecurity
public class SecurityConfig {
  private static final Logger log = LoggerFactory.getLogger(SecurityConfig.class);
  private final AppConfig appConfig;

  public SecurityConfig(AppConfig appConfig) {
    this.appConfig = appConfig;
  }

  @Bean
  public PasswordEncoder passwordEncoder() {
    return new BCryptPasswordEncoder();
  }

  @Bean
  public AuthenticationManager authenticationManager(
      AuthUserDetailsService userDetailsService, PasswordEncoder passwordEncoder) {
    DaoAuthenticationProvider provider = new DaoAuthenticationProvider();
    provider.setUserDetailsService(userDetailsService);
    provider.setPasswordEncoder(passwordEncoder);
    return new ProviderManager(provider);
  }

  @Bean
  public SecurityFilterChain securityFilterChain(HttpSecurity http, JwtAuthFilter jwtAuthFilter, ApiRateLimitFilter apiRateLimitFilter)
      throws Exception {
    http.csrf(csrf -> csrf.disable());
    http.cors(Customizer.withDefaults());
    http.headers(
        headers ->
            headers
                .contentSecurityPolicy(csp -> csp.policyDirectives("default-src 'self'"))
                .frameOptions(frame -> frame.deny())
                .httpStrictTransportSecurity(
                    hsts -> hsts.includeSubDomains(true).preload(true).maxAgeInSeconds(31536000)));
    http.sessionManagement(sm -> sm.sessionCreationPolicy(SessionCreationPolicy.STATELESS));
    http.authorizeHttpRequests(
        auth ->
            auth.requestMatchers(HttpMethod.OPTIONS, "/**")
                .permitAll()
                .requestMatchers("/api/auth/**")
                .permitAll()
                .requestMatchers("/error")
                .permitAll()
                .anyRequest()
                .authenticated());
    http.exceptionHandling(
        ex ->
            ex.authenticationEntryPoint(
                    (req, res, e) -> {
                      String auth = req.getHeader("Authorization");
                      String path = req.getRequestURI();
                      Object original = req.getAttribute(RequestDispatcher.ERROR_REQUEST_URI);
                      if (original instanceof String s && !s.isBlank()) {
                        path = s + " (dispatched to " + path + ")";
                      }
                      log.warn(
                          "401 Unauthorized: path={} method={} hasAuthHeader={}",
                          path,
                          req.getMethod(),
                          auth != null && !auth.isBlank());
                      res.sendError(HttpStatus.UNAUTHORIZED.value(), "Unauthorized");
                    })
                .accessDeniedHandler(
                    (req, res, e) -> res.sendError(HttpStatus.FORBIDDEN.value(), "Forbidden")));
    http.addFilterBefore(apiRateLimitFilter, UsernamePasswordAuthenticationFilter.class);
    http.addFilterBefore(jwtAuthFilter, UsernamePasswordAuthenticationFilter.class);
    return http.build();
  }

  @Bean
  public CorsConfigurationSource corsConfigurationSource() {
    CorsConfiguration config = new CorsConfiguration();
    config.setAllowCredentials(true);
    Arrays.stream((appConfig.getCors().getAllowedOrigins() == null ? "" : appConfig.getCors().getAllowedOrigins()).split(","))
        .map(String::trim)
        .filter(s -> !s.isBlank())
        .forEach(config::addAllowedOriginPattern);
    config.addAllowedHeader("*");
    config.setAllowedMethods(
        java.util.List.of("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"));
    config.setMaxAge(3600L);
    UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
    source.registerCorsConfiguration("/**", config);
    return source;
  }
}
