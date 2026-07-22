import com.cloudinary.Cloudinary;
import com.cloudinary.utils.ObjectUtils;
import java.io.File;
import java.net.URL;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.Map;

public class CloudinaryIntegrationTest {
    public static void main(String[] args) throws Exception {
        System.out.println("=== Cloudinary Integration Test ===\n");

        // STEP 1: Configure Cloudinary with credentials
        String cloudName = "ddm1jkelv"; // ← replace this with your cloud name
        String apiKey = "969539889143787"; // ← replace this with your API key
        String apiSecret = "8ZgW-ymgd5hWTLoQ7i2l7S2cpe8"; // ← replace this with your API secret

        Cloudinary cloudinary = new Cloudinary(
                ObjectUtils.asMap(
                        "cloud_name", cloudName,
                        "api_key", apiKey,
                        "api_secret", apiSecret,
                        "secure", true));

        System.out.println("✓ Cloudinary configured with cloud: " + cloudName);
        System.out.println();

        // STEP 2: Upload a sample image from Cloudinary's demo
        System.out.println("→ Uploading sample image...");
        String demoImageUrl = "https://res.cloudinary.com/demo/image/upload/sample.jpg";
        String publicId = "attendance/test-qr-" + System.currentTimeMillis();

        Map<?, ?> uploadResult = cloudinary.uploader().upload(
                demoImageUrl,
                ObjectUtils.asMap(
                        "public_id", publicId,
                        "overwrite", true,
                        "resource_type", "auto"));

        String secureUrl = (String) uploadResult.get("secure_url");
        String uploadedPublicId = (String) uploadResult.get("public_id");
        System.out.println("✓ Upload successful!");
        System.out.println("  Secure URL: " + secureUrl);
        System.out.println("  Public ID: " + uploadedPublicId);
        System.out.println();

        // STEP 3: Get image metadata
        System.out.println("→ Fetching image metadata...");
        Map<?, ?> resourceInfo = cloudinary.api().resource(
                uploadedPublicId,
                ObjectUtils.asMap("resource_type", "image"));

        Integer width = (Integer) resourceInfo.get("width");
        Integer height = (Integer) resourceInfo.get("height");
        String format = (String) resourceInfo.get("format");
        Integer bytes = (Integer) resourceInfo.get("bytes");

        System.out.println("✓ Metadata retrieved:");
        System.out.println("  Width: " + width + "px");
        System.out.println("  Height: " + height + "px");
        System.out.println("  Format: " + format);
        System.out.println("  Size: " + bytes + " bytes");
        System.out.println();

        // STEP 4: Transform the image with optimization
        System.out.println("→ Generating optimized image URL...");

        // f_auto: Automatically selects the best format (WebP, AVIF, etc.) based on
        // browser
        // q_auto: Automatically adjusts quality for optimal compression
        String transformedUrl = cloudinary.url()
                .transformation(new com.cloudinary.Transformation()
                        .format("auto") // f_auto
                        .quality("auto")) // q_auto
                .publicId(uploadedPublicId)
                .generate();

        System.out.println("✓ Optimization applied:");
        System.out.println("  f_auto: Automatically selects best format (WebP, AVIF, etc.)");
        System.out.println("  q_auto: Automatically adjusts quality for optimal file size");
        System.out.println();

        // SUCCESS
        System.out.println(
                "✓✓✓ Done! Click link below to see optimized version of the image. Check the size and format. ✓✓✓");
        System.out.println();
        System.out.println("Original URL: " + secureUrl);
        System.out.println("Optimized URL: " + transformedUrl);
        System.out.println();
        System.out.println("Cloudinary integration is working correctly!");
    }
}
