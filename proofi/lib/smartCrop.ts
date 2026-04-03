export interface CropResult {
  croppedFile: File;
  wasCropped: boolean;
  originalDimensions: { width: number; height: number };
  croppedDimensions: { width: number; height: number };
}

const PADDING_PX = 12;
const MIN_CROP_BENEFIT_PERCENT = 10;
const SAMPLE_STEP = 2;
const EDGE_TOLERANCE = 15;

export async function smartCropBadge(file: File): Promise<CropResult> {
  return new Promise((resolve) => {
    const img = new Image();
    const url = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(url);

      const canvas = document.createElement("canvas");
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      const ctx = canvas.getContext("2d");

      if (!ctx) {
        resolve({
          croppedFile: file,
          wasCropped: false,
          originalDimensions: { width: img.naturalWidth, height: img.naturalHeight },
          croppedDimensions: { width: img.naturalWidth, height: img.naturalHeight },
        });
        return;
      }

      ctx.drawImage(img, 0, 0);

      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const { data, width, height } = imageData;

      const bgColor = detectBackgroundColor(data, width, height);

      const bounds = findContentBounds(data, width, height, bgColor, SAMPLE_STEP, EDGE_TOLERANCE);

      if (!bounds) {
        resolve({
          croppedFile: file,
          wasCropped: false,
          originalDimensions: { width, height },
          croppedDimensions: { width, height },
        });
        return;
      }

      const cropX = Math.max(0, bounds.left - PADDING_PX);
      const cropY = Math.max(0, bounds.top - PADDING_PX);
      const cropW = Math.min(width, bounds.right + PADDING_PX) - cropX;
      const cropH = Math.min(height, bounds.bottom + PADDING_PX) - cropY;

      const cropAreaPercent = (cropW * cropH) / (width * height) * 100;
      const savedPercent = 100 - cropAreaPercent;

      if (savedPercent < MIN_CROP_BENEFIT_PERCENT) {
        resolve({
          croppedFile: file,
          wasCropped: false,
          originalDimensions: { width, height },
          croppedDimensions: { width, height },
        });
        return;
      }

      const croppedCanvas = document.createElement("canvas");
      croppedCanvas.width = cropW;
      croppedCanvas.height = cropH;
      const croppedCtx = croppedCanvas.getContext("2d");

      if (!croppedCtx) {
        resolve({
          croppedFile: file,
          wasCropped: false,
          originalDimensions: { width, height },
          croppedDimensions: { width, height },
        });
        return;
      }

      croppedCtx.drawImage(canvas, cropX, cropY, cropW, cropH, 0, 0, cropW, cropH);

      croppedCanvas.toBlob(
        (blob) => {
          if (!blob) {
            resolve({
              croppedFile: file,
              wasCropped: false,
              originalDimensions: { width, height },
              croppedDimensions: { width, height },
            });
            return;
          }

          const croppedFile = new File([blob], file.name, { type: "image/png" });

          resolve({
            croppedFile,
            wasCropped: true,
            originalDimensions: { width, height },
            croppedDimensions: { width: cropW, height: cropH },
          });
        },
        "image/png",
        0.95
      );
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      resolve({
        croppedFile: file,
        wasCropped: false,
        originalDimensions: { width: 0, height: 0 },
        croppedDimensions: { width: 0, height: 0 },
      });
    };

    img.src = url;
  });
}

interface BackgroundColor {
  r: number;
  g: number;
  b: number;
  isTransparent: boolean;
}

function detectBackgroundColor(
  data: Uint8ClampedArray,
  width: number,
  height: number
): BackgroundColor {
  const corners = [
    getPixel(data, width, 0, 0),
    getPixel(data, width, width - 1, 0),
    getPixel(data, width, 0, height - 1),
    getPixel(data, width, width - 1, height - 1),
    getPixel(data, width, Math.floor(width / 2), 0),
    getPixel(data, width, 0, Math.floor(height / 2)),
    getPixel(data, width, width - 1, Math.floor(height / 2)),
    getPixel(data, width, Math.floor(width / 2), height - 1),
  ];

  const transparentCount = corners.filter((c) => c.a < 30).length;
  if (transparentCount >= 5) {
    return { r: 0, g: 0, b: 0, isTransparent: true };
  }

  const opaque = corners.filter((c) => c.a >= 200);
  if (opaque.length === 0) return { r: 255, g: 255, b: 255, isTransparent: false };

  const avgR = Math.round(opaque.reduce((s, c) => s + c.r, 0) / opaque.length);
  const avgG = Math.round(opaque.reduce((s, c) => s + c.g, 0) / opaque.length);
  const avgB = Math.round(opaque.reduce((s, c) => s + c.b, 0) / opaque.length);

  return { r: avgR, g: avgG, b: avgB, isTransparent: false };
}

interface Bounds {
  top: number;
  bottom: number;
  left: number;
  right: number;
}

function findContentBounds(
  data: Uint8ClampedArray,
  width: number,
  height: number,
  bg: BackgroundColor,
  step: number,
  tolerance: number
): Bounds | null {
  let top = height;
  let bottom = 0;
  let left = width;
  let right = 0;
  let found = false;

  for (let y = 0; y < height; y += step) {
    for (let x = 0; x < width; x += step) {
      const pixel = getPixel(data, width, x, y);

      if (isBackground(pixel, bg, tolerance)) continue;

      found = true;
      if (y < top) top = y;
      if (y > bottom) bottom = y;
      if (x < left) left = x;
      if (x > right) right = x;
    }
  }

  if (!found) return null;

  return { top, bottom, left, right };
}

function getPixel(
  data: Uint8ClampedArray,
  width: number,
  x: number,
  y: number
): { r: number; g: number; b: number; a: number } {
  const idx = (y * width + x) * 4;
  return {
    r: data[idx],
    g: data[idx + 1],
    b: data[idx + 2],
    a: data[idx + 3],
  };
}

function isBackground(
  pixel: { r: number; g: number; b: number; a: number },
  bg: BackgroundColor,
  tolerance: number
): boolean {
  if (pixel.a < 30) return true;

  if (bg.isTransparent) return pixel.a < 30;

  return (
    Math.abs(pixel.r - bg.r) <= tolerance &&
    Math.abs(pixel.g - bg.g) <= tolerance &&
    Math.abs(pixel.b - bg.b) <= tolerance &&
    pixel.a > 200
  );
}
