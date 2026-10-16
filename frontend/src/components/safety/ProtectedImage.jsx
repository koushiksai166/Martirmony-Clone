import { useEffect, useRef } from "react";
import { useAuth } from "../../hooks/useAuth";

/**
 * Renders a profile image with a semi-transparent watermark overlay
 * containing the viewer's email — deters screenshot sharing.
 */
function ProtectedImage({ src, alt, className = "" }) {
  const canvasRef = useRef(null);
  const { user } = useAuth();

  useEffect(() => {
    if (!src || !canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.src = src;
    img.onload = () => {
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      ctx.drawImage(img, 0, 0);

      // Watermark text
      const text = user?.email ? `Vivah · ${user.email}` : "Vivah · Protected";
      ctx.save();
      ctx.globalAlpha = 0.18;
      ctx.fillStyle = "#ffffff";
      ctx.font = `bold ${Math.max(14, canvas.width / 30)}px sans-serif`;
      ctx.translate(canvas.width / 2, canvas.height / 2);
      ctx.rotate(-Math.PI / 6);
      ctx.textAlign = "center";
      // Repeat watermark in a grid
      for (let y = -canvas.height; y < canvas.height; y += 80) {
        for (let x = -canvas.width; x < canvas.width; x += 200) {
          ctx.fillText(text, x, y);
        }
      }
      ctx.restore();
    };
  }, [src, user?.email]);

  if (!src) return null;

  return (
    <canvas
      ref={canvasRef}
      className={`protected-content ${className}`}
      aria-label={alt}
      style={{ maxWidth: "100%", display: "block" }}
    />
  );
}

export default ProtectedImage;
