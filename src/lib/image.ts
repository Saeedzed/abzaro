/**
 * Browser image helpers shared by the resize and compress tools.
 *
 * Nothing here touches the network: files are read with FileReader/createImageBitmap
 * and re-encoded through a canvas in the visitor's browser.
 */

export const ACCEPTED_IMAGE_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "image/bmp",
  "image/avif",
] as const;

export const MAX_FILE_BYTES = 25 * 1024 * 1024; // 25 MB

export type OutputFormat = "image/jpeg" | "image/png" | "image/webp";

export interface LoadedImage {
  bitmap: ImageBitmap;
  width: number;
  height: number;
  name: string;
  size: number;
  type: string;
}

export interface ImageError {
  message: string;
}

/** Persian digits + Persian decimal separator, so sizes read naturally. */
function toFaNumber(value: number, fractionDigits: number): string {
  return value
    .toFixed(fractionDigits)
    .replace(/[0-9]/g, (d) => "۰۱۲۳۴۵۶۷۸۹".charAt(Number(d)))
    .replace(".", "٫");
}

/** Human-readable byte size in Persian. */
export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${toFaNumber(bytes, 0)} بایت`;
  const kb = bytes / 1024;
  if (kb < 1024) return `${toFaNumber(kb, 1)} کیلوبایت`;
  return `${toFaNumber(kb / 1024, 2)} مگابایت`;
}

export function isAcceptedType(type: string): boolean {
  return (ACCEPTED_IMAGE_TYPES as readonly string[]).includes(type);
}

/** Load a user file into an ImageBitmap, validating type and size. */
export async function loadImageFile(file: File): Promise<LoadedImage | ImageError> {
  if (!isAcceptedType(file.type)) {
    return { message: "فقط فایل‌های تصویری (JPG، PNG، WebP، GIF، AVIF) پذیرفته می‌شوند." };
  }
  if (file.size > MAX_FILE_BYTES) {
    return { message: "حجم فایل باید کمتر از ۲۵ مگابایت باشد." };
  }
  try {
    const bitmap = await createImageBitmap(file);
    return {
      bitmap,
      width: bitmap.width,
      height: bitmap.height,
      name: file.name,
      size: file.size,
      type: file.type,
    };
  } catch {
    return { message: "خواندن این تصویر ممکن نشد. فایل دیگری را امتحان کنید." };
  }
}

export function isLoadError(result: LoadedImage | ImageError): result is ImageError {
  return "message" in result;
}

/** Extension for a given MIME type. */
export function extensionFor(format: OutputFormat): string {
  if (format === "image/png") return "png";
  if (format === "image/webp") return "webp";
  return "jpg";
}

export interface RenderOptions {
  width: number;
  height: number;
  format: OutputFormat;
  /** 0–1, only meaningful for JPEG/WebP. */
  quality: number;
}

/** Draw a bitmap to a canvas and encode it to a Blob. */
export async function renderImage(
  bitmap: ImageBitmap,
  options: RenderOptions,
): Promise<Blob> {
  const { width, height, format, quality } = options;
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(width));
  canvas.height = Math.max(1, Math.round(height));

  const context = canvas.getContext("2d");
  if (!context) throw new Error("Canvas is not available in this browser.");

  // White background for JPEG (no alpha support), otherwise transparent.
  if (format === "image/jpeg") {
    context.fillStyle = "#ffffff";
    context.fillRect(0, 0, canvas.width, canvas.height);
  }

  context.imageSmoothingEnabled = true;
  context.imageSmoothingQuality = "high";
  context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);

  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) resolve(blob);
        else reject(new Error("Encoding failed."));
      },
      format,
      format === "image/png" ? undefined : quality,
    );
  });
}

/** Compute a scaled size that fits inside a box, preserving aspect ratio. */
export function fitWithin(
  width: number,
  height: number,
  maxWidth: number,
  maxHeight: number,
): { width: number; height: number } {
  const ratio = Math.min(maxWidth / width, maxHeight / height, 1);
  return {
    width: Math.max(1, Math.round(width * ratio)),
    height: Math.max(1, Math.round(height * ratio)),
  };
}

/** Suggest a scale factor as a percentage of the original width. */
export function scaledSize(
  width: number,
  height: number,
  percent: number,
): { width: number; height: number } {
  const factor = Math.max(1, percent) / 100;
  return {
    width: Math.max(1, Math.round(width * factor)),
    height: Math.max(1, Math.round(height * factor)),
  };
}

/** Trigger a browser download for a blob. */
export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  // Give the browser a moment before revoking the URL.
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}
