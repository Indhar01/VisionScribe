/**
 * Utility to convert any image (including SVGs and SVG data URLs)
 * into a valid raster Base64 PNG data URL compatible with Gemini Vision API.
 */
export async function rasterizeToPngBase64(
  imageSource: string,
  targetWidth = 600,
  targetHeight = 400
): Promise<{ dataUrl: string; mimeType: string }> {
  // If it's already a standard raster base64 (JPEG, PNG, WEBP), return directly
  if (
    (imageSource.startsWith("data:image/png;base64,") ||
      imageSource.startsWith("data:image/jpeg;base64,") ||
      imageSource.startsWith("data:image/webp;base64,")) &&
    !imageSource.includes("<svg")
  ) {
    const mime = imageSource.startsWith("data:image/png")
      ? "image/png"
      : imageSource.startsWith("data:image/webp")
      ? "image/webp"
      : "image/jpeg";
    return { dataUrl: imageSource, mimeType: "image/png" };
  }

  // It's an SVG (either data:image/svg+xml, raw <svg, or utf8 encoded)
  return new Promise((resolve) => {
    let src = imageSource;
    if (imageSource.trim().startsWith("<svg")) {
      src = "data:image/svg+xml;charset=utf-8," + encodeURIComponent(imageSource);
    } else if (imageSource.startsWith("data:image/svg+xml;utf8,")) {
      const rawXml = imageSource.replace("data:image/svg+xml;utf8,", "");
      src = "data:image/svg+xml;charset=utf-8," + encodeURIComponent(rawXml);
    }

    const img = new Image();
    img.crossOrigin = "anonymous";

    img.onload = () => {
      try {
        const canvas = document.createElement("canvas");
        canvas.width = targetWidth;
        canvas.height = targetHeight;
        const ctx = canvas.getContext("2d");

        if (ctx) {
          // Fill dark industrial telemetry background
          ctx.fillStyle = "#0f172a";
          ctx.fillRect(0, 0, targetWidth, targetHeight);
          ctx.drawImage(img, 0, 0, targetWidth, targetHeight);
          const pngUrl = canvas.toDataURL("image/png");
          resolve({ dataUrl: pngUrl, mimeType: "image/png" });
          return;
        }
      } catch (err) {
        console.warn("Canvas rasterization failed:", err);
      }
      resolve({ dataUrl: imageSource, mimeType: "image/png" });
    };

    img.onerror = () => {
      console.warn("Image load failed during rasterization, generating fallback canvas");
      // Fallback: draw an informative industrial telemetry placeholder on canvas
      const canvas = document.createElement("canvas");
      canvas.width = targetWidth;
      canvas.height = targetHeight;
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.fillStyle = "#1e293b";
        ctx.fillRect(0, 0, targetWidth, targetHeight);
        ctx.strokeStyle = "#38bdf8";
        ctx.lineWidth = 2;
        ctx.strokeRect(20, 20, targetWidth - 40, targetHeight - 40);
        ctx.fillStyle = "#f8fafc";
        ctx.font = "bold 16px sans-serif";
        ctx.fillText("VISIONSCRIBE OPTICAL TELEMETRY", 40, 60);
        ctx.fillStyle = "#f59e0b";
        ctx.font = "14px monospace";
        ctx.fillText("DEFECT ANOMALY CAPTURED", 40, 90);
        resolve({ dataUrl: canvas.toDataURL("image/png"), mimeType: "image/png" });
      } else {
        resolve({ dataUrl: imageSource, mimeType: "image/png" });
      }
    };

    img.src = src;
  });
}
