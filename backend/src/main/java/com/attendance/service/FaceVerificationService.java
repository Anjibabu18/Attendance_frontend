package com.attendance.service;

import com.attendance.config.AppConfig;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.attendance.domain.Employee;
import java.awt.Graphics2D;
import java.awt.Image;
import java.awt.image.BufferedImage;
import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.io.InputStream;
import java.net.URL;
import java.net.URI;
import java.net.URISyntaxException;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import javax.imageio.ImageIO;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

@Service
public class FaceVerificationService {
  private static final int HASH_SIZE = 16;
  private static final double VERIFIED_THRESHOLD = 0.50d;
  private static final ObjectMapper JSON = new ObjectMapper();
  private final AppConfig appConfig;
  private final HttpClient httpClient;

  public FaceVerificationService(AppConfig appConfig) {
    this.appConfig = appConfig;
    this.httpClient = HttpClient.newBuilder().build();
  }

  public FaceVerificationResult verify(Employee employee, MultipartFile punchPhoto) {
    if (employee == null || employee.getProfilePhotoUrl() == null || employee.getProfilePhotoUrl().isBlank()) {
      return new FaceVerificationResult(null, false, "Profile photo missing");
    }
    if (appConfig.getFace().isServiceEnabled()) {
      return verifyWithFaceService(employee, punchPhoto);
    }
    try {
      BufferedImage profile = readProfile(employee.getProfilePhotoUrl());
      BufferedImage punch = readPunch(punchPhoto);
      if (profile == null || punch == null) {
        return new FaceVerificationResult(null, false, "Unreadable image");
      }
      long[] a = hash(profile);
      long[] b = hash(punch);
      int totalBits = HASH_SIZE * HASH_SIZE;
      int distance = hamming(a, b);
      double similarity = Math.max(0d, 1d - (distance / (double) totalBits));
      return new FaceVerificationResult(similarity, similarity >= VERIFIED_THRESHOLD, similarity >= VERIFIED_THRESHOLD ? "Verified" : "Low similarity");
    } catch (Exception ex) {
      return new FaceVerificationResult(null, false, "Verification unavailable");
    }
  }

  public FaceDetectionResult detectFace(MultipartFile photo) {
    if (photo == null || photo.isEmpty()) {
      return new FaceDetectionResult(false, 0, "Photo is required");
    }
    if (appConfig.getFace().isServiceEnabled()) {
      FaceDetectionResult serviceResult = detectWithFaceService(photo);
      if (serviceResult.available()) {
        return serviceResult;
      }
    }
    try {
      BufferedImage image = readPunch(photo);
      return new FaceDetectionResult(
          image != null,
          image == null ? 0 : 1,
          image == null ? "Unreadable image" : "Image accepted; face service disabled");
    } catch (Exception ex) {
      return new FaceDetectionResult(false, 0, "Unreadable image");
    }
  }

  private FaceDetectionResult detectWithFaceService(MultipartFile photo) {
    try {
      String boundary = "----attendance-face-detect-" + System.nanoTime();
      ByteArrayOutputStream out = new ByteArrayOutputStream();
      writePart(out, boundary, "image", "image.jpg", contentType(photo), photo.getBytes());
      out.write(("--" + boundary + "--\r\n").getBytes(StandardCharsets.UTF_8));
      HttpRequest request =
          HttpRequest.newBuilder(detectUri())
              .timeout(Duration.ofMillis(Math.max(1000, appConfig.getFace().getTimeoutMillis())))
              .header("Content-Type", "multipart/form-data; boundary=" + boundary)
              .POST(HttpRequest.BodyPublishers.ofByteArray(out.toByteArray()))
              .build();
      HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
      if (response.statusCode() < 200 || response.statusCode() >= 300) {
        return new FaceDetectionResult(false, 0, "Face detection service unavailable", false);
      }
      JsonNode json = JSON.readTree(response.body());
      boolean detected = json.path("faceDetected").asBoolean(false);
      int count = json.path("faceCount").asInt(detected ? 1 : 0);
      String message =
          json.has("message")
              ? json.path("message").asText()
              : detected ? "Face detected" : "No face detected";
      return new FaceDetectionResult(detected, count, message, true);
    } catch (Exception ex) {
      return new FaceDetectionResult(false, 0, "Face detection service unavailable", false);
    }
  }

  private FaceVerificationResult verifyWithFaceService(Employee employee, MultipartFile punchPhoto) {
    try {
      byte[] profileBytes = readProfileBytes(employee.getProfilePhotoUrl());
      byte[] punchBytes = punchPhoto.getBytes();
      String boundary = "----attendance-face-" + System.nanoTime();
      HttpRequest request =
          HttpRequest.newBuilder(URI.create(appConfig.getFace().getServiceUrl()))
              .timeout(Duration.ofMillis(Math.max(1000, appConfig.getFace().getTimeoutMillis())))
              .header("Content-Type", "multipart/form-data; boundary=" + boundary)
              .POST(
                  HttpRequest.BodyPublishers.ofByteArray(
                      multipartBody(boundary, profileBytes, punchBytes)))
              .build();
      HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
      if (response.statusCode() < 200 || response.statusCode() >= 300) {
        return new FaceVerificationResult(null, false, serviceErrorMessage(response.body(), "Face service unavailable"));
      }
      JsonNode json = JSON.readTree(response.body());
      double score = json.path("score").asDouble(-1d);
      if (score < 0d) {
        return new FaceVerificationResult(null, false, "Face service returned no score");
      }
      boolean verified =
          (json.has("verified")
              ? json.path("verified").asBoolean(false)
              : true)
              && score >= appConfig.getFace().getMinScore();
      String model = json.path("model").asText("face-service");
      String serviceMessage = json.path("message").asText("");
      String message =
          verified
              ? "Verified by " + model
              : serviceMessage.isBlank()
                  ? "Face mismatch by " + model + "; required " + Math.round(appConfig.getFace().getMinScore() * 100) + "%"
                  : serviceMessage;
      return new FaceVerificationResult(score, verified, message);
    } catch (Exception ex) {
      return new FaceVerificationResult(null, false, "Face service unavailable");
    }
  }

  private static String serviceErrorMessage(String body, String fallback) {
    try {
      JsonNode json = JSON.readTree(body);
      String detail = json.path("detail").asText("");
      return detail.isBlank() ? fallback : detail;
    } catch (Exception ex) {
      return fallback;
    }
  }

  private static byte[] readProfileBytes(String photoUrl) throws Exception {
    try (InputStream in = new URL(photoUrl).openStream()) {
      return in.readAllBytes();
    }
  }

  private URI detectUri() throws URISyntaxException {
    URI verify = URI.create(appConfig.getFace().getServiceUrl());
    String path = verify.getPath() == null || verify.getPath().isBlank() ? "/detect" : verify.getPath().replaceFirst("/verify$", "/detect");
    if (path.equals(verify.getPath())) {
      path = "/detect";
    }
    return new URI(verify.getScheme(), verify.getAuthority(), path, verify.getQuery(), verify.getFragment());
  }

  private static String contentType(MultipartFile file) {
    String type = file.getContentType();
    return type == null || type.isBlank() ? "image/jpeg" : type;
  }

  private static byte[] multipartBody(String boundary, byte[] profileBytes, byte[] punchBytes) throws Exception {
    ByteArrayOutputStream out = new ByteArrayOutputStream();
    writePart(out, boundary, "profile", "profile.jpg", "image/jpeg", profileBytes);
    writePart(out, boundary, "punch", "punch.jpg", "image/jpeg", punchBytes);
    out.write(("--" + boundary + "--\r\n").getBytes(StandardCharsets.UTF_8));
    return out.toByteArray();
  }

  private static void writePart(
      ByteArrayOutputStream out,
      String boundary,
      String name,
      String filename,
      String contentType,
      byte[] bytes)
      throws Exception {
    out.write(("--" + boundary + "\r\n").getBytes(StandardCharsets.UTF_8));
    out.write(
        ("Content-Disposition: form-data; name=\"" + name + "\"; filename=\"" + filename + "\"\r\n")
            .getBytes(StandardCharsets.UTF_8));
    out.write(("Content-Type: " + contentType + "\r\n\r\n").getBytes(StandardCharsets.UTF_8));
    out.write(bytes);
    out.write("\r\n".getBytes(StandardCharsets.UTF_8));
  }

  private static BufferedImage readProfile(String photoUrl) throws Exception {
    try (InputStream in = new URL(photoUrl).openStream()) {
      return ImageIO.read(in);
    }
  }

  private static BufferedImage readPunch(MultipartFile file) throws Exception {
    if (file == null || file.isEmpty()) return null;
    return ImageIO.read(new ByteArrayInputStream(file.getBytes()));
  }

  private static long[] hash(BufferedImage source) {
    BufferedImage scaled = new BufferedImage(HASH_SIZE, HASH_SIZE, BufferedImage.TYPE_BYTE_GRAY);
    Graphics2D g = scaled.createGraphics();
    Image img = source.getScaledInstance(HASH_SIZE, HASH_SIZE, Image.SCALE_SMOOTH);
    g.drawImage(img, 0, 0, null);
    g.dispose();
    long sum = 0;
    int[] vals = new int[HASH_SIZE * HASH_SIZE];
    int idx = 0;
    for (int y = 0; y < HASH_SIZE; y++) {
      for (int x = 0; x < HASH_SIZE; x++) {
        int value = scaled.getRGB(x, y) & 0xff;
        vals[idx++] = value;
        sum += value;
      }
    }
    double avg = sum / (double) vals.length;
    long[] out = new long[4];
    for (int i = 0; i < vals.length; i++) {
      if (vals[i] >= avg) {
        out[i / 64] |= 1L << (i % 64);
      }
    }
    return out;
  }

  private static int hamming(long[] a, long[] b) {
    int count = 0;
    for (int i = 0; i < a.length; i++) {
      count += Long.bitCount(a[i] ^ b[i]);
    }
    return count;
  }

  public record FaceVerificationResult(Double similarityScore, boolean verified, String message) {}

  public record FaceDetectionResult(boolean faceDetected, int faceCount, String message, boolean available) {
    public FaceDetectionResult(boolean faceDetected, int faceCount, String message) {
      this(faceDetected, faceCount, message, true);
    }
  }
}
