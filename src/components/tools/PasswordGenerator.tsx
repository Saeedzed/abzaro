"use client";

import { useEffect, useState } from "react";
import { Check, Copy, KeyRound, RefreshCw, ShieldCheck } from "lucide-react";
import { PASSWORD_SETS, generatePassword, passwordStrength, type PasswordCharset } from "@/lib/password";
import { toPersianDigits } from "@/lib/persian";
import { ToolPanel } from "./shared";
import { cn } from "@/lib/utils";

const SET_LABELS: Record<PasswordCharset, string> = {
  lower: "حروف کوچک (a-z)",
  upper: "حروف بزرگ (A-Z)",
  digits: "اعداد (2-9)",
  symbols: "نمادها (!@#$)",
};

const STRENGTH_COLORS = [
  "bg-rose-500",
  "bg-orange-500",
  "bg-amber-500",
  "bg-emerald-500",
  "bg-emerald-600",
];

/** تولید رمز عبور قوی — همه‌چیز در مرورگر، هیچ رمزی جایی فرستاده نمی‌شود. */
export function PasswordGenerator() {
  const [length, setLength] = useState(16);
  const [sets, setSets] = useState<PasswordCharset[]>(["lower", "upper", "digits", "symbols"]);
  const [count, setCount] = useState(1);
  const [passwords, setPasswords] = useState<string[]>([]);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  function regenerate() {
    setPasswords(
      Array.from({ length: count }, () => generatePassword({ length, sets })),
    );
  }

  useEffect(() => {
    regenerate();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [length, sets, count]);

  function toggleSet(set: PasswordCharset) {
    setSets((current) => {
      const next = current.includes(set)
        ? current.filter((item) => item !== set)
        : [...current, set];
      return next.length === 0 ? current : next;
    });
  }

  async function copy(value: string, index: number) {
    try {
      await navigator.clipboard.writeText(value);
      setCopiedIndex(index);
      window.setTimeout(() => setCopiedIndex(null), 2000);
    } catch {
      // Clipboard blocked — the password is still selectable on screen.
    }
  }

  const strength = passwords[0] ? passwordStrength(passwords[0]) : null;

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <ToolPanel
        title="تنظیمات رمز"
        description="طول و نوع کاراکترها را انتخاب کنید"
        icon={<KeyRound className="h-4 w-4 text-brand-600" aria-hidden="true" />}
      >
        <div className="space-y-4">
          <div>
            <div className="flex items-center justify-between">
              <label htmlFor="pw-length" className="text-sm font-semibold text-ink-700">
                طول رمز
              </label>
              <span className="text-sm font-bold text-brand-700">{toPersianDigits(length)}</span>
            </div>
            <input
              id="pw-length"
              type="range"
              min={8}
              max={64}
              value={length}
              onChange={(event) => setLength(Number(event.target.value))}
              data-testid="password-length"
              className="mt-2 w-full accent-brand-600"
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            {(Object.keys(PASSWORD_SETS) as PasswordCharset[]).map((set) => (
              <button
                key={set}
                type="button"
                onClick={() => toggleSet(set)}
                aria-pressed={sets.includes(set)}
                data-testid={`password-set-${set}`}
                className={cn(
                  "rounded-xl border px-3 py-2 text-start text-[11px] font-medium transition",
                  sets.includes(set)
                    ? "border-brand-500 bg-brand-50 text-brand-800"
                    : "border-ink-200 bg-white text-ink-600 hover:border-brand-300",
                )}
              >
                {SET_LABELS[set]}
              </button>
            ))}
          </div>

          <div>
            <p className="mb-2 text-sm font-semibold text-ink-700">تعداد رمز</p>
            <div className="flex gap-2">
              {[1, 5, 10].map((value) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setCount(value)}
                  aria-pressed={count === value}
                  className={cn(
                    "flex-1 rounded-lg border px-2 py-1.5 text-[11px] font-semibold transition",
                    count === value
                      ? "border-brand-300 bg-brand-50 text-brand-700"
                      : "border-ink-200 text-ink-600 hover:bg-ink-100",
                  )}
                >
                  {toPersianDigits(value)}
                </button>
              ))}
            </div>
          </div>

          <button
            type="button"
            onClick={regenerate}
            data-testid="password-generate"
            className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-brand-600 px-4 py-2.5 text-sm font-bold text-white shadow-card transition hover:bg-brand-700"
          >
            <RefreshCw className="h-4 w-4" aria-hidden="true" />
            ساخت رمز جدید
          </button>
        </div>
      </ToolPanel>

      <ToolPanel
        title="رمزهای ساخته‌شده"
        description="روی هر رمز بزنید تا کپی شود"
        icon={<ShieldCheck className="h-4 w-4 text-brand-600" aria-hidden="true" />}
      >
        <div className="space-y-2">
          {passwords.map((password, index) => (
            <button
              key={`${password}-${index}`}
              type="button"
              onClick={() => copy(password, index)}
              data-testid={index === 0 ? "password-value" : undefined}
              className="flex w-full items-center justify-between gap-3 rounded-xl border border-ink-200 bg-ink-50 px-3 py-2.5 text-start transition hover:border-brand-300 hover:bg-brand-50"
            >
              <code dir="ltr" className="truncate font-mono text-sm font-semibold text-ink-900">
                {password}
              </code>
              {copiedIndex === index ? (
                <Check className="h-4 w-4 shrink-0 text-emerald-600" aria-hidden="true" />
              ) : (
                <Copy className="h-4 w-4 shrink-0 text-ink-400" aria-hidden="true" />
              )}
            </button>
          ))}

          {strength && (
            <div className="pt-2" data-testid="password-strength">
              <div className="flex items-center justify-between text-[11px] font-semibold text-ink-600">
                <span>قدرت رمز: {strength.label}</span>
                <span className="text-ink-400">
                  {toPersianDigits(Math.round(strength.entropy))} بیت آنتروپی
                </span>
              </div>
              <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-ink-100">
                <div
                  className={cn("h-full rounded-full transition-all", STRENGTH_COLORS[strength.score])}
                  style={{ width: `${((strength.score + 1) / 5) * 100}%` }}
                />
              </div>
            </div>
          )}

          <p className="pt-1 text-[11px] leading-6 text-ink-400">
            رمزها با <code dir="ltr">crypto.getRandomValues</code> ساخته می‌شوند و هیچ
            درخواستی به سرور فرستاده نمی‌شود. حروف شبیه به هم (l، I، 1، O، 0) حذف
            شده‌اند.
          </p>
        </div>
      </ToolPanel>
    </div>
  );
}
