/**
 * Image and Blueprint Rasterizer Utility
 * Allows drawing defect hotspots, scale rulers, and calibration grids on inspection images
 */

export function rasterizeDefectOverlay(
  canvas: HTMLCanvasElement,
  imageSrc: string,
  hotspots: Array<{ x: number; y: number; label?: string; severity?: string }>
): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('Canvas context unavailable'));
        return;
      }

      // Draw background image
      ctx.drawImage(img, 0, 0);

      // Draw aerospace engineering grid
      ctx.strokeStyle = 'rgba(56, 189, 248, 0.2)';
      ctx.lineWidth = 1;
      const step = Math.max(30, Math.floor(img.width / 20));
      for (let x = 0; x < img.width; x += step) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, img.height);
        ctx.stroke();
      }
      for (let y = 0; y < img.height; y += step) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(img.width, y);
        ctx.stroke();
      }

      // Draw Hotspots
      hotspots.forEach((spot, idx) => {
        const px = (spot.x / 100) * img.width;
        const py = (spot.y / 100) * img.height;
        const color = spot.severity === 'critical' ? '#ef4444' : spot.severity === 'minor' ? '#eab308' : '#38bdf8';

        // Outer pulse circle
        ctx.beginPath();
        ctx.arc(px, py, 18, 0, 2 * Math.PI);
        ctx.fillStyle = color === '#ef4444' ? 'rgba(239, 68, 68, 0.25)' : 'rgba(56, 189, 248, 0.25)';
        ctx.fill();
        ctx.strokeStyle = color;
        ctx.lineWidth = 2;
        ctx.stroke();

        // Crosshairs
        ctx.beginPath();
        ctx.moveTo(px - 26, py);
        ctx.lineTo(px + 26, py);
        ctx.moveTo(px, py - 26);
        ctx.lineTo(px, py + 26);
        ctx.stroke();

        // Center dot
        ctx.beginPath();
        ctx.arc(px, py, 4, 0, 2 * Math.PI);
        ctx.fillStyle = '#ffffff';
        ctx.fill();

        // Label box
        const labelText = spot.label || `DEFECT #${idx + 1}`;
        ctx.font = 'bold 14px "JetBrains Mono", monospace';
        const textWidth = ctx.measureText(labelText).width;
        
        ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
        ctx.fillRect(px + 20, py - 25, textWidth + 14, 24);
        ctx.strokeStyle = color;
        ctx.strokeRect(px + 20, py - 25, textWidth + 14, 24);

        ctx.fillStyle = '#ffffff';
        ctx.fillText(labelText, px + 27, py - 9);
      });

      // Export composite data URL
      resolve(canvas.toDataURL('image/jpeg', 0.85));
    };
    img.onerror = (err) => reject(err);
    img.src = imageSrc;
  });
}
