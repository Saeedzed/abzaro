"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { toPersianDigits } from "@/lib/persian";
import { cn } from "@/lib/utils";

/** Crop rectangle in source-image pixels. */
export interface CropRect {
  x: number;
  y: number;
  w: number;
  h: number;
}

interface CropEditorProps {
  /** Object URL of the image being cropped. */
  src: string;
  imageWidth: number;
  imageHeight: number;
  /** width / height, 0 = free crop. */
  ratio: number;
  rect: CropRect;
  onRectChange: (rect: CropRect) => void;
}

type Handle = "move" | "nw" | "ne" | "sw" | "se";

const HANDLES: Array<{ id: Exclude<Handle, "move">; cursor: string; style: string }> = [
  { id: "nw", cursor: "nwse-resize", style: "-translate-x-1/2 -translate-y-1/2" },
  { id: "ne", cursor: "nesw-resize", style: "translate-x-1/2 -translate-y-1/2" },
  { id: "sw", cursor: "nesw-resize", style: "-translate-x-1/2 translate-y-1/2" },
  { id: "se", cursor: "nwse-resize", style: "translate-x-1/2 translate-y-1/2" },
];

const MIN_SIZE = 40; // source pixels — keeps the box grabbable

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

/** Fit a ratio-sized box inside the image, centred on (cx, cy). */
export function fitRatioRect(
  width: number,
  height: number,
  ratio: number,
  cx = width / 2,
  cy = height / 2,
  scale = 1,
): CropRect {
  if (!ratio) return { x: 0, y: 0, w: width, h: height };
  let w = width * scale;
  let h = w / ratio;
  if (h > height * scale) {
    h = height * scale;
    w = h * ratio;
  }
  w = Math.max(MIN_SIZE, w);
  h = Math.max(MIN_SIZE, h);
  const x = clamp(cx - w / 2, 0, Math.max(0, width - w));
  const y = clamp(cy - h / 2, 0, Math.max(0, height - h));
  return { x, y, w, h };
}

/**
 * Interactive crop box drawn on top of the image, the way a phone's photo
 * editor works: drag the middle to move, drag a corner to resize. All maths is
 * in source pixels, so the exported crop is full resolution.
 */
export function CropEditor({
  src,
  imageWidth,
  imageHeight,
  ratio,
  rect,
  onRectChange,
}: CropEditorProps) {
  const frameRef = useRef<HTMLDivElement>(null);
  const [frame, setFrame] = useState({ width: 0, height: 0 });
  const [dragging, setDragging] = useState(false);
  const dragRef = useRef<{
    handle: Handle;
    startX: number;
    startY: number;
    rect: CropRect;
  } | null>(null);

  // Display box = image aspect ratio, capped by the container width and 60vh.
  useEffect(() => {
    const element = frameRef.current;
    if (!element) return;
    const update = () => {
      const available = element.parentElement?.clientWidth ?? element.clientWidth;
      const maxHeight = typeof window === "undefined" ? 420 : window.innerHeight * 0.55;
      const width = Math.max(40, Math.min(available, (maxHeight * imageWidth) / imageHeight));
      setFrame({
        width,
        height: Math.max(40, (width * imageHeight) / imageWidth),
      });
    };
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, [imageWidth, imageHeight]);

  const scale = frame.width > 0 ? frame.width / imageWidth : 0;

  const display = useMemo(
    () => ({
      x: rect.x * scale,
      y: rect.y * scale,
      w: rect.w * scale,
      h: rect.h * scale,
    }),
    [rect, scale],
  );

  // Window-level pointer tracking: the drag keeps working even when the finger
  // slides outside the (small) handle, which is what breaks naive handlers.
  const onPointerDown = (handle: Handle) => (event: React.PointerEvent) => {
    event.preventDefault();
    event.stopPropagation();
    dragRef.current = {
      handle,
      startX: event.clientX,
      startY: event.clientY,
      rect: { ...rect },
    };
    setDragging(true);
  };

  useEffect(() => {
    if (!dragging) return;

    const move = (event: PointerEvent) => {
      const drag = dragRef.current;
      if (!drag || !scale) return;
      const dx = (event.clientX - drag.startX) / scale;
      const dy = (event.clientY - drag.startY) / scale;
      const start = drag.rect;
      let next: CropRect;

      if (drag.handle === "move") {
        next = {
          x: clamp(start.x + dx, 0, imageWidth - start.w),
          y: clamp(start.y + dy, 0, imageHeight - start.h),
          w: start.w,
          h: start.h,
        };
      } else {
        const left = drag.handle === "nw" || drag.handle === "sw";
        const top = drag.handle === "nw" || drag.handle === "ne";
        // Anchor = the corner that must stay put.
        const anchorX = left ? start.x + start.w : start.x;
        const anchorY = top ? start.y + start.h : start.y;
        const movingX = left ? start.x : start.x + start.w;
        const movingY = top ? start.y : start.y + start.h;

        const pointerX = clamp(movingX + dx, 0, imageWidth);
        const pointerY = clamp(movingY + dy, 0, imageHeight);

        let w = Math.abs(anchorX - pointerX);
        let h = Math.abs(anchorY - pointerY);

        if (ratio) {
          if (w / Math.max(h, 0.001) > ratio) h = w / ratio;
          else w = h * ratio;
          const maxW = left ? anchorX : imageWidth - anchorX;
          const maxH = top ? anchorY : imageHeight - anchorY;
          if (w > maxW) {
            w = maxW;
            h = w / ratio;
          }
          if (h > maxH) {
            h = maxH;
            w = h * ratio;
          }
        }

        w = clamp(w, MIN_SIZE, imageWidth);
        h = clamp(h, MIN_SIZE, imageHeight);

        next = {
          x: left ? anchorX - w : anchorX,
          y: top ? anchorY - h : anchorY,
          w,
          h,
        };
      }

      onRectChange(next);
    };

    const up = () => {
      dragRef.current = null;
      setDragging(false);
    };

    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
    window.addEventListener("pointercancel", up);
    return () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
      window.removeEventListener("pointercancel", up);
    };
  }, [dragging, scale, ratio, imageWidth, imageHeight, onRectChange]);

  const keyboardMove = (event: React.KeyboardEvent) => {
    const step = event.shiftKey ? 20 : 4;
    const map: Record<string, [number, number]> = {
      ArrowLeft: [-step, 0],
      ArrowRight: [step, 0],
      ArrowUp: [0, -step],
      ArrowDown: [0, step],
    };
    const delta = map[event.key];
    if (!delta) return;
    event.preventDefault();
    onRectChange({
      x: clamp(rect.x + delta[0], 0, imageWidth - rect.w),
      y: clamp(rect.y + delta[1], 0, imageHeight - rect.h),
      w: rect.w,
      h: rect.h,
    });
  };

  return (
    <div className="rounded-xl bg-ink-900/5 p-2" data-testid="crop-editor">
      {/* Outer box: NOT clipped, so the corner handles can overhang the edges. */}
      <div
        ref={frameRef}
        className="relative mx-auto touch-none select-none"
        style={{ width: frame.width || "100%", height: frame.height || 240 }}
      >
        {/* Inner box clipped to the image: image + dimming + crop rectangle. */}
        <div className="absolute inset-0 overflow-hidden rounded-lg bg-ink-900/80">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={src}
            alt="تصویر برای برش"
            draggable={false}
            className="pointer-events-none h-full w-full object-contain"
          />

          <div
            role="group"
            aria-label="کادر برش — با کشیدن جابه‌جا کنید"
            tabIndex={0}
            onKeyDown={keyboardMove}
            onPointerDown={onPointerDown("move")}
            className="absolute cursor-move touch-none rounded-md ring-2 ring-white outline-none focus-visible:ring-brand-300"
            style={{
              left: display.x,
              top: display.y,
              width: display.w,
              height: display.h,
              // One huge spread shadow dims everything outside the crop box.
              boxShadow: "0 0 0 9999px rgba(2,6,23,0.55)",
            }}
            data-testid="crop-box"
          >
            {/* Thirds guides */}
            <div className="pointer-events-none absolute inset-0 opacity-60">
              <div className="absolute inset-y-0 start-1/3 border-s border-white/40" />
              <div className="absolute inset-y-0 end-1/3 border-e border-white/40" />
              <div className="absolute inset-x-0 top-1/3 border-t border-white/40" />
              <div className="absolute inset-x-0 bottom-1/3 border-b border-white/40" />
            </div>
          </div>
        </div>

        {/* Corner handles live outside the clipped layer, so half of each stays
            visible and the 44px hit area is fully clickable. */}
        {HANDLES.map((handle) => (
          <span
            key={handle.id}
            role="presentation"
            onPointerDown={onPointerDown(handle.id)}
            data-testid={`crop-handle-${handle.id}`}
            className={cn(
              "absolute flex h-11 w-11 touch-none items-center justify-center",
              handle.style,
            )}
            style={{
              cursor: handle.cursor,
              left: handle.id === "nw" || handle.id === "sw" ? display.x : undefined,
              right:
                handle.id === "ne" || handle.id === "se"
                  ? Math.max(0, frame.width - display.x - display.w)
                  : undefined,
              top: handle.id === "nw" || handle.id === "ne" ? display.y : undefined,
              bottom:
                handle.id === "sw" || handle.id === "se"
                  ? Math.max(0, frame.height - display.y - display.h)
                  : undefined,
            }}
          >
            <span className="pointer-events-none h-4 w-4 rounded-full border-2 border-white bg-white/70 shadow-md" />
          </span>
        ))}
      </div>

      <p className="mt-2 text-center text-[11px] text-ink-500">
        کادر را بکشید تا جابه‌جا شود؛ گوشه‌ها را بکشید تا اندازه عوض شود.
        {" "}
        <span className="text-ink-400">
          {toPersianDigits(Math.round(rect.w))}×{toPersianDigits(Math.round(rect.h))} پیکسل
        </span>
      </p>
    </div>
  );
}
