"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Download, Loader2, QrCode } from "lucide-react";
import { QR_COLORS, type QrEcc } from "@/lib/codec";
import { toPersianDigits } from "@/lib/persian";
import { cn } from "@/lib/utils";

const SIZES = [256, 512, 1024];
const ECC: Array<{ id: QrEcc; label: string; hint: string }> = [
  { id: "L", label: "کم", hint: "۷٪ بازیابی" },
  { id: "M", label: "متوسط", hint: "۱۵٪ بازیابی" },
  { id: "Q", label: "زیاد", hint: "۲۵٪ بازیابی" },
  { id: "H", label: "حداکثر", hint: "۳۰٪ بازیابی" },
];

const TYPES = [
  { id: "text", label: "متن" },
  { id: "url", label: "لینک" },
  { id: "wifi", label: "WiFi" },
  { id: "tel", label: "شماره تماس" },
  { id: "email", label: "ایمیل" },
];

/**
 * QR code generator.
 *
 * The matrix is produced by `qrcode` in the browser and drawn on a canvas, so
 * the code can be downloaded as PNG or copied as an SVG-free image. Nothing is
 * sent to a server (unlike most QR sites).
 */
export function QrCodeGenerator() {
  const [type, setType] = useState("text");
  const [text, setText] = useState("https://abzaro.netlify.app");
  const [size, setSize] = useState(512);
  const [margin, setMargin] = useState(4);
  const [ecc, setEcc] = useState<QrEcc>("M");
  const [colorIndex, setColorIndex] = useState(0);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const payload =
    type === "wifi"
      ? `WIFI:T:WPA;S:${text};P:;;`
      : type === "tel"
        ? `tel:${text}`
        : type === "email"
          ? `mailto:${text}`
          : text;

  const palette = QR_COLORS[colorIndex] ?? QR_COLORS[0];

  const render = useCallback(async () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    if (payload.trim() === "") {
      const context = canvas.getContext("2d");
      context?.clearRect(0, 0, canvas.width, canvas.height);
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const QRCode = (await import("qrcode")).default;
      await QRCode.toCanvas(canvas, payload, {
        width: size,
        margin,
        errorCorrectionLevel: ecc,
        color: { dark: palette.dark, light: palette.light },
      });
    } catch {
      setError("ساخت QR ممکن نشد. متن کوتاه‌تری امتحان کنید.");
    } finally {
      setBusy(false);
    }
  }, [payload, size, margin, ecc, palette.dark, palette.light]);

  useEffect(() => {
    void render();
  }, [render]);

  async function download() {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const url = canvas.toDataURL("image/png");
    const link = document.createElement("a");
    link.href = url;
    link.download = `qr-${size}.png`;
    document.body.appendChild(link);
    link.click();
    link.remove();
  }

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
      <div className="rounded-2xl border border-ink-200 bg-white p-4 shadow-card sm:p-5">
        <h3 className="flex items-center gap-2 text-sm font-bold text-ink-900">
          <QrCode className="h-4 w-4 text-brand-600" aria-hidden="true" />
          محتوا
        </h3>

        <div className="mt-3 flex flex-wrap gap-1.5">
          {TYPES.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setType(item.id)}
              aria-pressed={type === item.id}
              className={cn(
                "rounded-lg border px-2.5 py-1.5 text-[11px] font-semibold transition",
                type === item.id
                  ? "border-brand-300 bg-brand-50 text-brand-700"
                  : "border-ink-200 text-ink-600 hover:bg-ink-100",
              )}
            >
              {item.label}
            </button>
          ))}
        </div>

        <textarea
          value={text}
          onChange={(event) => setText(event.target.value)}
          rows={3}
          dir={type === "text" || type === "url" ? "ltr" : "rtl"}
          placeholder={
            type === "url"
              ? "https://example.com"
              : type === "wifi"
                ? "نام شبکهٔ وای‌فای"
                : type === "tel"
                  ? "09121234567"
                  : type === "email"
                    ? "hello@example.com"
                    : "متن یا لینک خود را بنویسید…"
          }
          data-testid="qr-text"
          className="mt-3 w-full resize-y rounded-xl border border-ink-200 bg-white p-3 text-sm text-ink-900 outline-none transition placeholder:text-ink-300 focus:border-brand-400 focus:ring-4 focus:ring-brand-100"
        />
        <p className="mt-1.5 text-[11px] text-ink-400">
          {toPersianDigits(payload.length)} کاراکتر
          {type === "wifi" && " — دستگاه‌های اندروید با اسکن، مستقیم به وای‌فای وصل می‌شوند"}
        </p>

        <fieldset className="mt-4">
          <legend className="mb-1.5 text-xs font-semibold text-ink-700">اندازه (پیکسل)</legend>
          <div className="flex gap-2">
            {SIZES.map((value) => (
              <button
                key={value}
                type="button"
                onClick={() => setSize(value)}
                aria-pressed={size === value}
                className={cn(
                  "flex-1 rounded-lg border px-2 py-2 text-[11px] font-semibold transition",
                  size === value
                    ? "border-brand-300 bg-brand-50 text-brand-700"
                    : "border-ink-200 text-ink-600 hover:bg-ink-100",
                )}
              >
                {toPersianDigits(value)}
              </button>
            ))}
          </div>
        </fieldset>

        <fieldset className="mt-4">
          <legend className="mb-1.5 text-xs font-semibold text-ink-700">مقاومت در برابر خطا</legend>
          <div className="flex gap-2">
            {ECC.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setEcc(item.id)}
                aria-pressed={ecc === item.id}
                title={item.hint}
                className={cn(
                  "flex-1 rounded-lg border px-1 py-2 text-[11px] font-semibold transition",
                  ecc === item.id
                    ? "border-brand-300 bg-brand-50 text-brand-700"
                    : "border-ink-200 text-ink-600 hover:bg-ink-100",
                )}
              >
                {item.label}
              </button>
            ))}
          </div>
        </fieldset>

        <fieldset className="mt-4">
          <legend className="mb-1.5 text-xs font-semibold text-ink-700">رنگ</legend>
          <div className="flex gap-2">
            {QR_COLORS.map((item, index) => (
              <button
                key={item.label}
                type="button"
                onClick={() => setColorIndex(index)}
                aria-pressed={colorIndex === index}
                aria-label={`رنگ ${item.label}`}
                title={item.label}
                className={cn(
                  "flex h-9 flex-1 items-center justify-center rounded-lg border-2 text-[10px] font-semibold transition",
                  colorIndex === index ? "border-brand-500" : "border-ink-200",
                )}
                style={{ backgroundColor: item.light, color: item.dark }}
              >
                {item.label}
              </button>
            ))}
          </div>
        </fieldset>

        <div className="mt-4 flex items-center gap-3">
          <label htmlFor="qr-margin" className="text-[11px] font-semibold text-ink-700">
            حاشیه: {toPersianDigits(margin)}
          </label>
          <input
            id="qr-margin"
            type="range"
            min={0}
            max={8}
            value={margin}
            onChange={(event) => setMargin(Number(event.target.value))}
            className="flex-1 accent-brand-600"
          />
        </div>
      </div>

      <div className="rounded-2xl border border-ink-200 bg-white p-4 shadow-card sm:p-5">
        <h3 className="text-sm font-bold text-ink-900">QR Code</h3>
        <div className="mt-3 flex flex-col items-center justify-center rounded-xl border border-ink-200 bg-ink-50 p-4">
          <canvas
            ref={canvasRef}
            data-testid="qr-canvas"
            className="h-56 w-56 rounded-lg bg-white shadow-card"
            aria-label="کد QR تولید‌شده"
          />
          {busy && (
            <p className="mt-2 inline-flex items-center gap-1.5 text-[11px] text-ink-500">
              <Loader2 className="h-3 w-3 animate-spin" aria-hidden="true" />
              در حال ساخت…
            </p>
          )}
        </div>

        {error && (
          <p role="alert" className="mt-3 text-xs font-medium text-red-600">
            {error}
          </p>
        )}

        <button
          type="button"
          onClick={() => void download()}
          disabled={payload.trim() === ""}
          data-testid="qr-download"
          className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-700 disabled:opacity-50"
        >
          <Download className="h-4 w-4" aria-hidden="true" />
          دانلود PNG ({toPersianDigits(size)}×{toPersianDigits(size)})
        </button>

        <p className="mt-3 text-[11px] leading-5 text-ink-400">
          کد QR در مرورگر شما ساخته می‌شود؛ لینک یا متن شما به هیچ سروری فرستاده
          نمی‌شود.
        </p>
      </div>
    </div>
  );
}
