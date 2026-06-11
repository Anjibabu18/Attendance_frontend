package com.attendance.service;

import com.attendance.domain.OfficeLocation;
import com.attendance.repo.OfficeLocationRepository;
import java.time.Instant;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class OfficeLocationService {
  private final OfficeLocationRepository officeLocationRepository;

  public OfficeLocationService(OfficeLocationRepository officeLocationRepository) {
    this.officeLocationRepository = officeLocationRepository;
  }

  public OfficeLocation getActiveOrThrow() {
    return officeLocationRepository
        .findFirstByActiveTrueOrderByUpdatedAtDesc()
        .orElseThrow(
            () ->
                new ApiException(
                    HttpStatus.BAD_REQUEST,
                    "Office location is not configured. Ask Admin to set office latitude/longitude and radius."));
  }

  public OfficeLocation getActiveOrNull() {
    return officeLocationRepository.findFirstByActiveTrueOrderByUpdatedAtDesc().orElse(null);
  }

  public List<OfficeLocation> listActive() {
    return officeLocationRepository.findByActiveTrueOrderByOfficeNameAscUpdatedAtDesc();
  }

  public OfficeLocation getByIdOrThrow(Long id) {
    return officeLocationRepository
        .findById(id)
        .filter(OfficeLocation::isActive)
        .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Office location not found"));
  }

  @Transactional
  public OfficeLocation upsertActive(String officeName, double latitude, double longitude, double radiusMeters) {
    validateCoordinates(latitude, longitude);
    if (radiusMeters <= 0) {
      throw new ApiException(HttpStatus.BAD_REQUEST, "radiusMeters must be > 0");
    }

    OfficeLocation loc = new OfficeLocation();
    loc.setOfficeName(officeName == null ? null : officeName.trim());
    loc.setLatitude(latitude);
    loc.setLongitude(longitude);
    loc.setRadiusMeters(radiusMeters);
    loc.setActive(true);
    loc.setUpdatedAt(Instant.now());
    return officeLocationRepository.save(loc);
  }

  @Transactional
  public OfficeLocation deactivate(Long id) {
    OfficeLocation loc = getByIdOrThrow(id);
    loc.setActive(false);
    loc.setUpdatedAt(Instant.now());
    return officeLocationRepository.save(loc);
  }

  private static void validateCoordinates(double latitude, double longitude) {
    if (Double.isNaN(latitude) || latitude < -90 || latitude > 90) {
      throw new ApiException(HttpStatus.BAD_REQUEST, "latitude must be between -90 and 90");
    }
    if (Double.isNaN(longitude) || longitude < -180 || longitude > 180) {
      throw new ApiException(HttpStatus.BAD_REQUEST, "longitude must be between -180 and 180");
    }
  }

  public static double distanceMeters(double lat1, double lon1, double lat2, double lon2) {
    // Haversine formula
    final double earthRadius = 6371000.0; // meters
    double dLat = Math.toRadians(lat2 - lat1);
    double dLon = Math.toRadians(lon2 - lon1);
    double a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2)
            + Math.cos(Math.toRadians(lat1))
                * Math.cos(Math.toRadians(lat2))
                * Math.sin(dLon / 2)
                * Math.sin(dLon / 2);
    double c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return earthRadius * c;
  }
}
