"use client";

import { useMemo, useState } from "react";
import { ArrowLeftRight, CalendarDays, Copy } from "lucide-react";
import { JALALI_MONTHS, jalaliMonthLength } from "@/lib/jalali";
import { fromGregorian, fromJalali } from "@/lib/date-convert";
import { toEnglishDigits, toPersianDigits } from "@/lib/persian";
import { cn } from "@/lib/utils";

type Direction = "jl2gr" | "gr2jl";

const GREGORIAN_MONTHS = [
  "ژانویه",
  "فوریه",
  "مارس",
  "آوریل",
  "مه",
  "ژوئن",
  "ژوئیه",
  "اوت",
  "سپتامبر",
  "اکتبر",
  "نوامبر",
  "دسامبر",
];

/** Plain Persian digits — years must not get a thousands separator. */
function faNum(value: number): string {
  return toPersianDigits(value);
}

/**
 * Jalali ↔ Gregorian date converter (both directions).
 *
 * Built on the tested arithmetic in `jalali.ts` — no new calendar code — and
 * shows the derived facts people actually want: weekday, day of year, ISO date.
 */
export function DateConverter() {
  const [direction, setDirection] = useState<Direction>("jl2gr");

  // Jalali fields
  const [jy, setJy] = useState("1404");
  const [jm, setJm] = useState("8");
  const [jd, setJd] = useState("14");

  // Gregorian fields
  const [gy, setGy] = useState("2025");
  const [gm, setGm] = useState("11");
  const [gd, setGd] = useState("5");

  const result = useMemo(() => {
    if (direction === "jl2gr") {
      const facts = fromJalali(
        Number(toEnglishDigits(jy)),
        Number(toEnglishDigits(jm)),
        Number(toEnglishDigits(jd)),
      );
      if (!facts) return null;
      return {
        jalaliLabel: `${faNum(facts.jalali.day)} ${JALALI_MONTHS[facts.jalali.month - 1] ?? ""} ${faNum(facts.jalali.year)}`,
        gregorianLabel: `${faNum(facts.gregorian.day)} ${GREGORIAN_MONTHS[facts.gregorian.month - 1] ?? ""} ${faNum(facts.gregorian.year)}`,
        iso: facts.iso,
        weekday: facts.weekday,
      };
    }

    const facts = fromGregorian(
      Number(toEnglishDigits(gy)),
      Number(toEnglishDigits(gm)),
      Number(toEnglishDigits(gd)),
    );
    if (!facts) return null;
    return {
      jalaliLabel: `${faNum(facts.jalali.day)} ${JALALI_MONTHS[facts.jalali.month - 1] ?? ""} ${faNum(facts.jalali.year)}`,
      gregorianLabel: `${faNum(facts.gregorian.day)} ${GREGORIAN_MONTHS[facts.gregorian.month - 1] ?? ""} ${faNum(facts.gregorian.year)}`,
      iso: facts.iso,
      weekday: facts.weekday,
    };
  }, [direction, jy, jm, jd, gy, gm, gd]);

  const jalaliDays = Math.max(29, jalaliMonthLength(Number(toEnglishDigits(jy)) || 1404, Number(toEnglishDigits(jm)) || 1));

  return (
    <div className="space-y-4">
      {/* direction switch */}
      <div className="flex items-center justify-center gap-2">
        {(
          [
            { id: "jl2gr" as const, label: "شمسی ← میلادی" },
            { id: "gr2jl" as const, label: "میلادی ← شمسی" },
          ]
        ).map((option) => (
          <button
            key={option.id}
            type="button"
            onClick={() => setDirection(option.id)}
            aria-pressed={direction === option.id}
            data-testid={`date-direction-${option.id}`}
            className={cn(
              "flex items-center gap-1.5 rounded-full border px-4 py-2 text-xs font-semibold transition",
              direction === option.id
                ? "border-brand-600 bg-brand-600 text-white"
                : "border-ink-200 bg-white text-ink-600 hover:border-brand-300 hover:text-brand-700",
            )}
          >
            <ArrowLeftRight className="h-3.5 w-3.5" aria-hidden="true" />
            {option.label}
          </button>
        ))}
      </div>

      <div className="rounded-2xl border border-ink-200 bg-white p-4 shadow-card sm:p-5">
        <h3 className="flex items-center gap-2 text-base font-bold text-ink-900">
          <CalendarDays className="h-4 w-4 text-brand-600" aria-hidden="true" />
          {direction === "jl2gr" ? "تاریخ شمسی را انتخاب کنید" : "تاریخ میلادی را انتخاب کنید"}
        </h3>

        {direction === "jl2gr" ? (
          <div className="mt-4 grid grid-cols-3 gap-2">
            <FieldSelect
              id="date-jy"
              label="سال"
              value={jy}
              onChange={setJy}
              options={Array.from({ length: 61 }, (_, i) => 1400 + i)}
              unit="شمسی"
            />
            <FieldSelect
              id="date-jm"
              label="ماه"
              value={jm}
              onChange={setJm}
              options={JALALI_MONTHS.map((_, index) => index + 1)}
              render={(value) => JALALI_MONTHS[value - 1] ?? String(value)}
              unit="شمسی"
            />
            <FieldSelect
              id="date-jd"
              label="روز"
              value={jd}
              onChange={setJd}
              options={Array.from({ length: jalaliDays }, (_, i) => i + 1)}
              unit="شمسی"
            />
          </div>
        ) : (
          <div className="mt-4 grid grid-cols-3 gap-2">
            <FieldSelect
              id="date-gy"
              label="سال"
              value={gy}
              onChange={setGy}
              options={Array.from({ length: 101 }, (_, i) => 1970 + i)}
              unit="میلادی"
              raw
            />
            <FieldSelect
              id="date-gm"
              label="ماه"
              value={gm}
              onChange={setGm}
              options={GREGORIAN_MONTHS.map((_, index) => index + 1)}
              render={(value) => GREGORIAN_MONTHS[value - 1] ?? String(value)}
              unit="میلادی"
              raw
            />
            <FieldSelect
              id="date-gd"
              label="روز"
              value={gd}
              onChange={setGd}
              options={Array.from({ length: 31 }, (_, i) => i + 1)}
              unit="میلادی"
              raw
            />
          </div>
        )}

        <div className="mt-4 grid gap-3 rounded-2xl bg-ink-50/70 p-4 sm:grid-cols-2">
          <ResultBlock label="تاریخ شمسی" value={result?.jalaliLabel ?? "—"} testId="date-out-jalali" />
          <ResultBlock label="تاریخ میلادی" value={result?.gregorianLabel ?? "—"} testId="date-out-gregorian" />
          <ResultBlock label="روز هفته" value={result ? (result.weekday || "—") : "—"} testId="date-out-weekday" />
          <ResultBlock label="فرمت استاندارد (ISO)" value={result?.iso ?? "—"} testId="date-out-iso" ltr />
        </div>

        {!result && (
          <p role="alert" className="mt-3 text-xs font-medium text-red-600" data-testid="date-error">
            این تاریخ در هیچ‌کدام از دو تقویم وجود ندارد یا خارج از بازهٔ پشتیبانی
            است. دوباره بررسی کنید.
          </p>
        )}
      </div>
    </div>
  );
}

function FieldSelect({
  id,
  label,
  value,
  onChange,
  options,
  render,
  unit,
  raw = false,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: number[];
  render?: (value: number) => string;
  unit: string;
  raw?: boolean;
}) {
  return (
    <div>
      <label htmlFor={id} className="mb-1 block text-[11px] font-semibold text-ink-600">
        {label} <span className="text-ink-400">({unit})</span>
      </label>
      <select
        id={id}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="w-full rounded-xl border border-ink-200 bg-white px-3 py-2.5 text-sm text-ink-900 outline-none transition focus:border-brand-400 focus:ring-4 focus:ring-brand-100"
      >
        {options.map((option) => (
          <option key={option} value={String(option)}>
            {render ? render(option) : raw ? option : faNum(option)}
          </option>
        ))}
      </select>
    </div>
  );
}

function ResultBlock({ label, value, testId, ltr = false }: { label: string; value: string; testId: string; ltr?: boolean }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1500);
    } catch {
      /* ignore */
    }
  }

  return (
    <div className="rounded-xl border border-ink-200 bg-white px-3 py-2.5">
      <p className="text-[11px] text-ink-500">{label}</p>
      <div className="mt-1 flex items-center justify-between gap-2">
        <p
          dir={ltr ? "ltr" : undefined}
          data-testid={testId}
          className={cn("text-sm font-bold text-ink-900", ltr && "text-left")}
        >
          {value}
        </p>
        <button
          type="button"
          onClick={() => void copy()}
          aria-label={`کپی ${label}`}
          className="shrink-0 rounded-md p-1 text-ink-400 transition hover:bg-ink-100 hover:text-brand-600"
        >
          <Copy className="h-3.5 w-3.5" aria-hidden="true" />
          <span className="sr-only">{copied ? "کپی شد" : "کپی"}</span>
        </button>
      </div>
    </div>
  );
}
