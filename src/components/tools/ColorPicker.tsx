"use client";

import { useMemo, useState } from "react";
import { Pipette, Palette } from "lucide-react";
import {
  hslToRgb,
  parseHex,
  readableTextColor,
  rgbToHex,
  rgbToHsl,
} from "@/lib/data-tools";
import { toPersianDigits } from "@/lib/persian";
import { ResultRow, ToolPanel } from "./shared";

const PRESETS = ["#2563eb", "#0f172a", "#16a34a", "#dc2626", "#f59e0b", "#7c3aed", "#0ea5e9", "#64748b"];

/** انتخاب رنگ و تبدیل HEX / RGB / HSL. */
export function ColorPicker() {
  const [hex, setHex] = useState("#2563eb");
  const [hsl, setHsl] = useState(() => {
    const rgb = parseHex("#2563eb");
    return rgb ? rgbToHsl(rgb) : { h: 221, s: 83, l: 53 };
  });

  const rgb = useMemo(() => parseHex(hex), [hex]);
  const safeHex = rgb ? rgbToHex(rgb) : "#000000";
  const textColor = readableTextColor(rgb ?? { r: 0, g: 0, b: 0 });

  function applyHex(value: string) {
    setHex(value);
    const parsed = parseHex(value);
    if (parsed) setHsl(rgbToHsl(parsed));
  }

  function applyHsl(next: { h?: number; s?: number; l?: number }) {
    const merged = { ...hsl, ...next };
    setHsl(merged);
    setHex(rgbToHex(hslToRgb(merged)));
  }

  const rgbText = rgb ? `rgb(${rgb.r}, ${rgb.g}, ${rgb.b})` : "";
  const hslText = `hsl(${hsl.h}, ${hsl.s}%, ${hsl.l}%)`;

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <ToolPanel
        title="انتخاب رنگ"
        description="با انتخابگر یا کد HEX"
        icon={<Palette className="h-4 w-4 text-brand-600" aria-hidden="true" />}
      >
        <div className="space-y-4">
          <div
            className="flex h-24 items-center justify-center rounded-2xl border border-ink-200 text-sm font-bold"
            style={{ backgroundColor: safeHex, color: textColor }}
            data-testid="color-preview"
          >
            {safeHex.toUpperCase()}
          </div>

          <div className="flex items-center gap-3">
            <input
              type="color"
              value={safeHex}
              onChange={(event) => applyHex(event.target.value)}
              aria-label="انتخاب رنگ"
              className="h-11 w-14 cursor-pointer rounded-lg border border-ink-200 bg-white p-1"
            />
            <div className="flex-1">
              <label htmlFor="hex-input" className="mb-1 block text-xs font-semibold text-ink-700">
                کد HEX
              </label>
              <input
                id="hex-input"
                dir="ltr"
                value={hex}
                onChange={(event) => applyHex(event.target.value)}
                data-testid="color-hex"
                className="w-full rounded-lg border border-ink-200 px-3 py-2 font-mono text-sm outline-none focus:border-brand-400"
              />
            </div>
          </div>

          <div className="grid gap-3">
            {(
              [
                { key: "h", label: "رنگ (Hue)", max: 360, suffix: "°" },
                { key: "s", label: "اشباع (Saturation)", max: 100, suffix: "٪" },
                { key: "l", label: "روشنایی (Lightness)", max: 100, suffix: "٪" },
              ] as const
            ).map((slider) => (
              <div key={slider.key}>
                <div className="flex items-center justify-between text-xs font-semibold text-ink-700">
                  <label htmlFor={`hsl-${slider.key}`}>{slider.label}</label>
                  <span dir="ltr" className="text-brand-700">
                    {toPersianDigits(hsl[slider.key])}
                    {slider.suffix}
                  </span>
                </div>
                <input
                  id={`hsl-${slider.key}`}
                  type="range"
                  min={0}
                  max={slider.max}
                  value={hsl[slider.key]}
                  onChange={(event) => applyHsl({ [slider.key]: Number(event.target.value) })}
                  className="mt-1 w-full accent-brand-600"
                />
              </div>
            ))}
          </div>

          <div>
            <p className="mb-2 text-xs font-semibold text-ink-700">رنگ‌های پرکاربرد</p>
            <div className="flex flex-wrap gap-2">
              {PRESETS.map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => applyHex(preset)}
                  aria-label={preset}
                  title={preset}
                  style={{ backgroundColor: preset }}
                  className="h-8 w-8 rounded-lg border border-ink-200 transition hover:scale-110"
                />
              ))}
            </div>
          </div>
        </div>
      </ToolPanel>

      <ToolPanel
        title="کدهای رنگ"
        description="برای کپی روی دکمه بزنید"
        icon={<Pipette className="h-4 w-4 text-brand-600" aria-hidden="true" />}
      >
        <div className="space-y-3">
          <ResultRow label="HEX" value={safeHex.toUpperCase()} testId="color-out-hex" />
          <ResultRow label="RGB" value={rgbText} testId="color-out-rgb" />
          <ResultRow label="HSL" value={hslText} testId="color-out-hsl" />
          {rgb && (
            <>
              <ResultRow label="R" value={toPersianDigits(rgb.r)} copyable={false} />
              <ResultRow label="G" value={toPersianDigits(rgb.g)} copyable={false} />
              <ResultRow label="B" value={toPersianDigits(rgb.b)} copyable={false} />
            </>
          )}
          <p className="rounded-xl bg-ink-50 px-3 py-2 text-[11px] leading-6 text-ink-500">
            کد HEX مستقیم در CSS و طراحی استفاده می‌شود؛ HSL برای ساخت پالت و
            تغییر روشنایی راحت‌تر است.
          </p>
        </div>
      </ToolPanel>
    </div>
  );
}
