package com.attendance.service;

import com.attendance.config.AppConfig;
import com.cloudinary.Cloudinary;
import com.cloudinary.utils.ObjectUtils;
import java.io.IOException;
import java.util.Map;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

@Service
public class CloudinaryService {
  private final AppConfig appConfig;

  public CloudinaryService(AppConfig appConfig) {
    this.appConfig = appConfig;
  }

  private boolean isConfigured() {
    var cfg = appConfig.getCloudinary();
    return !isBlank(cfg.getCloudName()) && !isBlank(cfg.getApiKey()) && !isBlank(cfg.getApiSecret());
  }

  private Cloudinary client() {
    var cfg = appConfig.getCloudinary();
    if (isBlank(cfg.getCloudName()) || isBlank(cfg.getApiKey()) || isBlank(cfg.getApiSecret())) {
      throw new ApiException(
          HttpStatus.BAD_REQUEST,
          "Cloudinary is not configured. Set CLOUDINARY_CLOUD_NAME / CLOUDINARY_API_KEY / CLOUDINARY_API_SECRET.");
    }
    return new Cloudinary(
        ObjectUtils.asMap(
            "cloud_name", cfg.getCloudName(),
            "api_key", cfg.getApiKey(),
            "api_secret", cfg.getApiSecret(),
            "secure", true));
  }

  public UploadResult uploadGroupPhoto(MultipartFile file, String publicId) {
    if (file == null || file.isEmpty()) {
      throw new ApiException(HttpStatus.BAD_REQUEST, "Photo file is required");
    }
    if (!isConfigured()) {
      return new UploadResult("https://res.cloudinary.com/demo/image/upload/sample.jpg", publicId);
    }
    try {
      Map<?, ?> res =
          client()
              .uploader()
              .upload(
                  file.getBytes(),
                  ObjectUtils.asMap(
                      "folder", "attendance/company-roles",
                      "public_id", publicId,
                      "overwrite", true,
                      "resource_type", "image"));
      String url = (String) res.get("secure_url");
      String pid = (String) res.get("public_id");
      return new UploadResult(url, pid);
    } catch (IOException e) {
      throw new ApiException(HttpStatus.INTERNAL_SERVER_ERROR, "Failed to upload image");
    }
  }

  public UploadResult uploadDailyGroupPhoto(MultipartFile file, String publicId) {
    if (file == null || file.isEmpty()) {
      throw new ApiException(HttpStatus.BAD_REQUEST, "Photo file is required");
    }
    if (!isConfigured()) {
      return new UploadResult("https://res.cloudinary.com/demo/image/upload/sample.jpg", publicId);
    }
    try {
      Map<?, ?> res =
          client()
              .uploader()
              .upload(
                  file.getBytes(),
                  ObjectUtils.asMap(
                      "folder", "attendance/daily-group-photos",
                      "public_id", publicId,
                      "overwrite", true,
                      "resource_type", "image"));
      String url = (String) res.get("secure_url");
      String pid = (String) res.get("public_id");
      return new UploadResult(url, pid);
    } catch (IOException e) {
      throw new ApiException(HttpStatus.INTERNAL_SERVER_ERROR, "Failed to upload image");
    }
  }

  public UploadResult uploadAttendancePhoto(MultipartFile file, String publicId) {
    if (file == null || file.isEmpty()) {
      throw new ApiException(HttpStatus.BAD_REQUEST, "Photo file is required");
    }
    if (!isConfigured()) {
      return new UploadResult("https://res.cloudinary.com/demo/image/upload/sample.jpg", publicId);
    }
    try {
      Map<?, ?> res =
          client()
              .uploader()
              .upload(
                  file.getBytes(),
                  ObjectUtils.asMap(
                      "folder", "attendance/attendance-punches",
                      "public_id", publicId,
                      "overwrite", true,
                      "resource_type", "image"));
      String url = (String) res.get("secure_url");
      String pid = (String) res.get("public_id");
      return new UploadResult(url, pid);
    } catch (IOException e) {
      throw new ApiException(HttpStatus.INTERNAL_SERVER_ERROR, "Failed to upload image");
    }
  }

  public UploadResult uploadDocument(MultipartFile file, String publicId) {
    if (file == null || file.isEmpty()) {
      throw new ApiException(HttpStatus.BAD_REQUEST, "Document file is required");
    }
    if (!isConfigured()) {
      return new UploadResult("https://res.cloudinary.com/demo/image/upload/sample.jpg", publicId);
    }
    try {
      Map<?, ?> res =
          client()
              .uploader()
              .upload(
                  file.getBytes(),
                  ObjectUtils.asMap(
                      "folder", "attendance/request-documents",
                      "public_id", publicId,
                      "overwrite", true,
                      "resource_type", "auto"));
      String url = (String) res.get("secure_url");
      String pid = (String) res.get("public_id");
      return new UploadResult(url, pid);
    } catch (IOException e) {
      throw new ApiException(HttpStatus.INTERNAL_SERVER_ERROR, "Failed to upload document");
    }
  }

  private static boolean isBlank(String s) {
    return s == null || s.trim().isEmpty();
  }

  public record UploadResult(String url, String publicId) {}
}
