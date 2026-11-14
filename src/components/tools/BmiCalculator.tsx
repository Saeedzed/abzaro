"use client";

import { useMemo } from "react";
import { Activity, HeartPulse, Scale } from "lucide-react";
import { calculateBmi } from "@/lib/finance";
import { toEnglishDigits } from "@/lib/persian";
import { NumberField, ResultHint, ResultRow, ToolPanel, formatFa } from "./shared";
import { ShareResult, useSharedInput } from "./ShareResult";

function parseNumber(value: string): number | null {
  const normalized = toEnglishDigits(value).replace(/[,٬\s]/g, "").replace("٫", ".");
  if (normalized === "" || !/^\d+(\.\d+)?$/.test(normalized)) return null;
  return Number(normalized);
}

const RANGES = [
  { label: "کمبود وزن", range: "< ۱۸٫۵", color: "bg-sky-100 text-sky-800" },
  { label: "نرمال", range: "۱۸٫۵ – ۲۴٫۹", color: "bg-emerald-100 text-emerald-800" },
  { label: "اضافه وزن", range: "۲۵ – ۲۹٫۹", color: "bg-amber-100 text-amber-800" },
  { label: "چاقی", range: "≥ ۳۰", color: "bg-red-100 text-red-800" },
];

export function BmiCalculator() {
  const [weight, setWeight] = useSharedInput("w");
  const [height, setHeight] = useSharedInput("h");

  const kg = parseNumber(weight);
  const cm = parseNumber(height);
  const result = useMemo(
    () => (kg !== null && cm !== null ? calculateBmi(kg, cm) : null),
    [kg, cm],
  );

  const percentOfScale = result ? Math.min(100, Math.max(0, ((result.bmi - 14) / 26) * 100)) : 0;

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <ToolPanel
        title="مشخصات شما"
        description="وزن به کیلوگرم و قد به سانتی‌متر."
        icon={<Scale className="h-4 w-4 text-brand-600" aria-hidden="true" />}
      >
        <div className="space-y-4">
          <NumberField
            label="وزن"
            value={weight}
            onChange={setWeight}
            placeholder="۷۰"
            suffix="کیلوگرم"
            step={0.1}
            autoFocus
          />
          <NumberField
            label="قد"
            value={height}
            onChange={setHeight}
            placeholder="۱۷۵"
            suffix="سانتی‌متر"
            step={0.5}
          />
          <p className="rounded-lg bg-ink-50 px-3 py-2 text-[11px] leading-5 text-ink-500">
            شاخص توده بدنی (BMI) نسبت وزن به مربع قد است و برای بزرگسالان
            محاسبه می‌شود؛ برای ورزشکاران و کودکان معیار کاملی نیست.
          </p>
        </div>
      </ToolPanel>

      <ToolPanel
        title="نتیجه"
        description="شاخص توده بدنی و محدودهٔ وزن سالم"
        icon={<HeartPulse className="h-4 w-4 text-brand-600" aria-hidden="true" />}
      >
        {result ? (
          <div className="space-y-3">
            <div className="rounded-xl border border-brand-200 bg-brand-50 px-4 py-4 text-center">
              <div className="text-xs font-medium text-brand-700">شاخص توده بدنی</div>
              <div className="mt-1 text-3xl font-extrabold text-brand-900" data-testid="bmi-value">
                {formatFa(result.bmi, 1)}
              </div>
              <div className="mt-1 text-sm font-bold text-brand-800" data-testid="bmi-category">
                {result.category}
              </div>
            </div>

            <div>
              <div className="relative h-2.5 overflow-hidden rounded-full bg-gradient-to-l from-red-400 via-emerald-400 to-sky-400">
                <span
                  className="absolute top-1/2 h-4 w-1 -translate-y-1/2 rounded-full bg-ink-900 ring-2 ring-white"
                  style={{ right: `${percentOfScale}%` }}
                  aria-hidden="true"
                />
              </div>
              <div className="mt-2 grid grid-cols-4 gap-1 text-center text-[10px]">
                {RANGES.map((item) => (
                  <div key={item.label} className={`rounded-md px-1 py-1 font-medium ${item.color}`}>
                    <div>{item.label}</div>
                    <div className="opacity-70">{item.range}</div>
                  </div>
                ))}
              </div>
            </div>

            <ResultRow
              label="محدودهٔ وزن سالم برای قد شما"
              value={`${formatFa(result.healthyMin, 1)} تا ${formatFa(result.healthyMax, 1)} کیلوگرم`}
            />
            <ResultRow label="وزن ایده‌آل (BMI ۲۲)" value={`${formatFa(result.idealWeight, 1)} کیلوگرم`} />
            {result.weightToAdjust > 0 && (
              <ResultRow
                label="برای رسیدن به محدودهٔ سالم"
                value={`${formatFa(result.weightToAdjust, 1)} کیلوگرم ${
                  kg !== null && kg < result.healthyMin ? "افزایش" : "کاهش"
                }`}
                emphasize
              />
            )}
            <ShareResult params={{ w: weight, h: height }} />
          </div>
        ) : (
          <ResultHint>
            <span className="inline-flex items-center gap-1.5">
              <Activity className="h-3.5 w-3.5" aria-hidden="true" />
              وزن و قد را وارد کنید تا شاخص محاسبه شود.
            </span>
          </ResultHint>
        )}
      </ToolPanel>
    </div>
  );
}
