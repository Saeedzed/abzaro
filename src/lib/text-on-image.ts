/**
 * Draw text over an image with the Canvas API.
 *
 * Persian needs three things a naive `fillText` gets wrong:
 *   - the browser's own text shaper (no manual reversing — Canvas handles RTL),
 *   - a fallback font stack that actually has Persian glyphs,
 *   - wrapping measured on the *same* context that draws, so lines never overflow.
 */

export interface TextOverlayOptions {
  text: string;
  fontSize: number;
  color: string;
  /** "top" | "center" | "bottom" */
  position: "top" | "center" | "bottom";
  /** 0–1, opacity of the text. */
  opacity: number;
  /** Draw a translucent band behind the text for legibility. */
  band: boolean;
  bandColor: string;
  /** 0–1, controls how wide the text block may be. */
  width: number;
  fontFamily?: string;
  bold?: boolean;
  align?: "right" | "center" | "left";
}

export const DEFAULT_FONT_STACK =
  '"Vazirmatn", "IRANSans", "Sahel", "Tahoma", "Segoe UI", sans-serif';

/** Split text into lines that fit `maxWidth`, breaking on spaces. */
export function wrapText(
  context: CanvasRenderingContext2D,
  text: string,
  maxWidth: number,
): string[] {
  const lines: string[] = [];
  for (const paragraph of text.split("\n")) {
    if (paragraph.trim() === "") {
      lines.push("");
      continue;
    }
    const words = paragraph.split(/\s+/);
    let current = "";
    for (const word of words) {
      const candidate = current === "" ? word : `${current} ${word}`;
      if (context.measureText(candidate).width <= maxWidth || current === "") {
        current = candidate;
      } else {
        lines.push(current);
        current = word;
      }
    }
    if (current !== "") lines.push(current);
  }
  return lines;
}

/** Render the image with the overlay, returning a PNG/JPEG blob. */
export async function renderImageWithText(
  image: HTMLImageElement,
  options: TextOverlayOptions,
  type: "image/png" | "image/jpeg" = "image/jpeg",
  quality = 0.92,
): Promise<{ blob: Blob; width: number; height: number }> {
  const canvas = document.createElement("canvas");
  canvas.width = image.naturalWidth || image.width;
  canvas.height = image.naturalHeight || image.height;
  const context = canvas.getContext("2d");
  if (!context) throw new Error("Canvas در این مرورگر پشتیبانی نمی‌شود.");

  context.drawImage(image, 0, 0, canvas.width, canvas.height);

  const fontSize = Math.max(8, Math.round(options.fontSize));
  const weight = options.bold ? "700" : "400";
  context.font = `${weight} ${fontSize}px ${options.fontFamily ?? DEFAULT_FONT_STACK}`;
  context.direction = "rtl";
  context.textBaseline = "top";

  const margin = Math.round(canvas.width * 0.05);
  const maxWidth = Math.round(canvas.width * options.width) - margin * 2;
  const lines = wrapText(context, options.text.trim(), maxWidth);
  const lineHeight = Math.round(fontSize * 1.5);
  const blockHeight = lines.length * lineHeight + margin;

  let startY: number;
  if (options.position === "top") startY = margin;
  else if (options.position === "bottom") startY = canvas.height - blockHeight;
  else startY = Math.round((canvas.height - blockHeight) / 2);

  if (options.band) {
    context.globalAlpha = options.opacity * 0.75;
    context.fillStyle = options.bandColor;
    context.fillRect(0, startY - margin / 2, canvas.width, blockHeight + margin / 2);
    context.globalAlpha = 1;
  }

  context.globalAlpha = options.opacity;
  context.fillStyle = options.color;
  context.textAlign = options.align ?? "center";
  const x =
    (options.align ?? "center") === "right"
      ? canvas.width - margin
      : (options.align ?? "center") === "left"
        ? margin
        : canvas.width / 2;

  lines.forEach((line, index) => {
    context.fillText(line, x, startY + index * lineHeight);
  });
  context.globalAlpha = 1;

  const blob = await new Promise<Blob | null>((resolve) =>
    canvas.toBlob(resolve, type, type === "image/jpeg" ? quality : undefined),
  );
  if (!blob) throw new Error("ساخت تصویر خروجی ناموفق بود.");
  return { blob, width: canvas.width, height: canvas.height };
}
