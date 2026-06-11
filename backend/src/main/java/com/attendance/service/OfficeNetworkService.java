package com.attendance.service;

import jakarta.servlet.http.HttpServletRequest;
import java.math.BigInteger;
import java.net.InetAddress;
import java.util.ArrayList;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;

@Service
public class OfficeNetworkService {
  private final AttendanceSettingsService attendanceSettingsService;

  public OfficeNetworkService(AttendanceSettingsService attendanceSettingsService) {
    this.attendanceSettingsService = attendanceSettingsService;
  }

  public void validatePunchNetwork(HttpServletRequest request) {
    var settings = attendanceSettingsService.get();
    if (!Boolean.TRUE.equals(settings.getOfficeIpRestrictionEnabled())) {
      return;
    }

    String clientIp = resolveClientIp(request, Boolean.TRUE.equals(settings.getTrustProxyHeaders()));
    List<CidrBlock> allowedNetworks = allowedNetworks(settings.getAllowedOfficeCidrs());
    if (allowedNetworks.isEmpty()) {
      throw new ApiException(
          HttpStatus.FORBIDDEN, "Office Wi-Fi/IP attendance is enabled but no office networks are configured");
    }

    if (allowedNetworks.stream().noneMatch(network -> network.contains(clientIp))) {
      throw new ApiException(
          HttpStatus.FORBIDDEN, "Attendance punch is allowed only from the office Wi-Fi/network");
    }
  }

  private static String resolveClientIp(HttpServletRequest request, boolean trustProxyHeaders) {
    if (trustProxyHeaders) {
      String forwardedFor = firstHeaderValue(request.getHeader("X-Forwarded-For"));
      if (!forwardedFor.isBlank()) {
        return cleanIp(forwardedFor);
      }
      String realIp = request.getHeader("X-Real-IP");
      if (realIp != null && !realIp.isBlank()) {
        return cleanIp(realIp);
      }
    }
    return cleanIp(request.getRemoteAddr());
  }

  private static String firstHeaderValue(String value) {
    if (value == null || value.isBlank()) {
      return "";
    }
    return value.split(",", 2)[0].trim();
  }

  private static String cleanIp(String value) {
    String ip = value == null ? "" : value.trim();
    if (ip.startsWith("[") && ip.contains("]")) {
      return ip.substring(1, ip.indexOf(']'));
    }
    int colon = ip.lastIndexOf(':');
    if (colon > 0 && ip.indexOf(':') == colon && ip.substring(colon + 1).matches("\\d+")) {
      return ip.substring(0, colon);
    }
    return ip;
  }

  private static List<CidrBlock> allowedNetworks(String value) {
    List<CidrBlock> networks = new ArrayList<>();
    if (value == null || value.isBlank()) {
      return networks;
    }
    for (String part : value.split(",")) {
      String cidr = part.trim();
      if (!cidr.isBlank()) {
        networks.add(CidrBlock.parse(cidr));
      }
    }
    return networks;
  }

  private record CidrBlock(InetAddress networkAddress, int prefixLength) {
    private static CidrBlock parse(String value) {
      String[] parts = value.split("/", 2);
      try {
        InetAddress address = InetAddress.getByName(parts[0].trim());
        int totalBits = address.getAddress().length * 8;
        int prefix = parts.length == 2 ? Integer.parseInt(parts[1].trim()) : totalBits;
        if (prefix < 0 || prefix > totalBits) {
          throw new IllegalArgumentException();
        }
        return new CidrBlock(address, prefix);
      } catch (Exception ex) {
        throw new ApiException(HttpStatus.INTERNAL_SERVER_ERROR, "Invalid office network CIDR: " + value);
      }
    }

    private boolean contains(String ip) {
      try {
        InetAddress address = InetAddress.getByName(ip);
        byte[] candidateBytes = address.getAddress();
        byte[] networkBytes = networkAddress.getAddress();
        if (candidateBytes.length != networkBytes.length) {
          return false;
        }
        int totalBits = networkBytes.length * 8;
        BigInteger candidate = new BigInteger(1, candidateBytes);
        BigInteger network = new BigInteger(1, networkBytes);
        return candidate.shiftRight(totalBits - prefixLength).equals(network.shiftRight(totalBits - prefixLength));
      } catch (Exception ex) {
        return false;
      }
    }
  }
}
