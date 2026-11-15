"use client";

import { useMemo, useState } from "react";
import { CheckCircle2, ShieldCheck, XCircle } from "lucide-react";
import {
  validateBankCard,
  validateMobile,
  validateNationalId,
  validatePlate,
  validatePostalCode,
  validateSheba,
  type CheckResult,
} from "@/lib/iran-ids";
import { ResultHint, ToolPanel } from "./shared";
import { CopyButton } from "./CopyButton";

/**
 * One validator row: an input plus a live verdict.
 *
 * All six Iranian validators share this shape, so they share one implementation
 * and only swap the `check` function — which is also how the tests cover them.
 */
interface Validator {
  key: string;
  label: string;
  placeholder: string;
  hint: string;
  check: (value: string) => CheckResult;
}

const VALIDATORS: Validator[] = [
  {
    key: "national-id",
    label: "کد ملی",
    placeholder: "مثلاً ۰۰۱۲۳۴۵۶۷۹",
    hint: "۱۰ رقم؛ رقم آخر با الگوریتم mod-11 بررسی می‌شود.",
    check: validateNationalId,
  },
  {
    key: "mobile",
    label: "شمارهٔ موبایل",
    placeholder: "۰۹۱۲۳۴۵۶۷۸۹ یا +989123456789",
    hint: "پیش‌شماره‌های +98، 0098 و 9 هم پذیرفته و یکسان‌سازی می‌شوند.",
    check: validateMobile,
  },
  {
    key: "bank-card",
    label: "شمارهٔ کارت بانکی",
    placeholder: "۶۰۳۷ ۹۹۱۲ ۳۴۵۶ ۷۸۹۰",
    hint: "۱۶ رقم؛ با الگوریتم Luhn و تشخیص بانک از روی ۶ رقم اول.",
    check: validateBankCard,
  },
  {
    key: "sheba",
    label: "شمارهٔ شبا",
    placeholder: "IR…",
    hint: "۲۶ نویسه؛ با استاندارد ISO 13616 (mod-97).",
    check: validateSheba,
  },
  {
    key: "postal-code",
    label: "کد پستی",
    placeholder: "۱۲۳۴۵۶۷۸۹۰",
    hint: "۱۰ رقم؛ بدون رقم‌های تکراری پشت‌سرهم.",
    check: validatePostalCode,
  },
  {
    key: "plate",
    label: "پلاک خودرو",
    placeholder: "۱۲ب۳۴۵۶۷",
    hint: "پلاک ملی (۲رقم+حرف+۳رقم+۲رقم) یا منطقهٔ آزاد (۳رقم+حرف+۲رقم).",
    check: validatePlate,
  },
];

/** The multi-field validator panel. */
export function IranianValidator() {
  const [values, setValues] = useState<Record<string, string>>({});

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      {VALIDATORS.map((validator) => (
        <ValidatorCard
          key={validator.key}
          validator={validator}
          value={values[validator.key] ?? ""}
          onChange={(next) => setValues((prev) => ({ ...prev, [validator.key]: next }))}
        />
      ))}
    </div>
  );
}

function ValidatorCard({
  validator,
  value,
  onChange,
}: {
  validator: Validator;
  value: string;
  onChange: (value: string) => void;
}) {
  const result = useMemo(
    () => (value.trim() === "" ? null : validator.check(value)),
    [validator, value],
  );
  const valid = result?.ok === true;

  return (
    <ToolPanel
      title={validator.label}
      icon={<ShieldCheck className="h-4 w-4 text-brand-600" aria-hidden="true" />}
    >
      <label className="sr-only" htmlFor={`v-${validator.key}`}>
        {validator.label}
      </label>
      <input
        id={`v-${validator.key}`}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={validator.placeholder}
        dir="ltr"
        inputMode="text"
        autoComplete="off"
        spellCheck={false}
        aria-invalid={result ? !result.ok : undefined}
        data-testid={`input-${validator.key}`}
        className={`w-full rounded-xl border px-4 py-3 text-left text-base font-semibold text-ink-900 outline-none transition placeholder:font-normal placeholder:text-ink-300 focus:ring-4 ${
          result === null
            ? "border-ink-200 focus:border-brand-400 focus:ring-brand-100"
            : valid
              ? "border-emerald-300 bg-emerald-50/40 focus:ring-emerald-100"
              : "border-rose-300 bg-rose-50/40 focus:ring-rose-100"
        }`}
      />

      <p className="mt-2 text-[11px] leading-5 text-ink-400">{validator.hint}</p>

      <div className="mt-3" aria-live="polite">
        {result === null ? (
          <ResultHint>برای بررسی، مقدار را وارد کنید. هیچ‌چیز ارسال نمی‌شود.</ResultHint>
        ) : valid ? (
          <div
            className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2.5"
            data-testid={`result-${validator.key}`}
          >
            <p className="flex items-center gap-1.5 text-sm font-bold text-emerald-800">
              <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
              معتبر است
            </p>
            {result.value && result.value !== value.trim() && (
              <p className="mt-1.5 text-[11px] leading-5 text-emerald-700">
                یکسان‌سازی‌شده:{" "}
                <span dir="ltr" className="font-mono">
                  {result.value}
                </span>
                <CopyButton value={result.value} />
              </p>
            )}
            {result.meta &&
              Object.entries(result.meta).map(([key, metaValue]) =>
                metaValue ? (
                  <p key={key} className="mt-1 text-[11px] leading-5 text-emerald-700">
                    {META_LABELS[key] ?? key}: <span dir="auto">{metaValue}</span>
                  </p>
                ) : null,
              )}
          </div>
        ) : (
          <div
            className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2.5"
            data-testid={`result-${validator.key}`}
          >
            <p className="flex items-start gap-1.5 text-sm font-bold text-rose-800">
              <XCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
              معتبر نیست
            </p>
            <p className="mt-1 text-[11px] leading-5 text-rose-700">{result.error}</p>
          </div>
        )}
      </div>
    </ToolPanel>
  );
}

const META_LABELS: Record<string, string> = {
  bank: "بانک",
  bban: "شمارهٔ حساب (BBAN)",
  bankCode: "کد بانک",
  letter: "حرف",
  left: "دو رقم اول",
  right: "سه رقم",
  province: "کد استان",
};

/** Single-field mode used by the six individual tool pages. */
export function SingleIranianValidator({ kind }: { kind: string }) {
  const validator = VALIDATORS.find((item) => item.key === kind);
  const [value, setValue] = useState("");
  if (!validator) {
    return (
      <p className="rounded-xl bg-rose-50 p-4 text-sm text-rose-700">
        نوع اعتبارسنج ناشناخته: {kind}
      </p>
    );
  }
  return (
    <div className="mx-auto max-w-xl">
      <ValidatorCard validator={validator} value={value} onChange={setValue} />
    </div>
  );
}
