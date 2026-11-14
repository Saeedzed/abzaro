"use client";

import { useMemo, useState } from "react";
import { Braces, FileSpreadsheet } from "lucide-react";
import { csvToJson, detectDelimiter, jsonToCsv } from "@/lib/data-tools";
import { toPersianDigits } from "@/lib/persian";
import { ToolPanel } from "./shared";

const SAMPLE_CSV = `نام,شهر,سن
سعید,تهران,32
مریم,اصفهان,27
"رضا, نیکو",شیراز,41`;

const SAMPLE_JSON = `[
  { "نام": "سعید", "شهر": "تهران", "سن": 32 },
  { "نام": "مریم", "شهر": "اصفهان", "سن": 27 }
]`;

type Mode = "csv-to-json" | "json-to-csv";

/** تبدیل CSV ↔ JSON — پارس واقعی با پشتیبانی از فیلدهای داخل گیومه. */
export function CsvJsonConverter() {
  const [mode, setMode] = useState<Mode>("csv-to-json");
  const [input, setInput] = useState(SAMPLE_CSV);
  const [pretty, setPretty] = useState(true);

  const canParseJson = useMemo(() => {
    try {
      JSON.parse(input);
      return true;
    } catch {
      return false;
    }
  }, [input]);

  const output = useMemo(() => {
    if (input.trim() === "") return "";
    try {
      if (mode === "csv-to-json") {
        const json = csvToJson(input);
        return pretty ? JSON.stringify(json, null, 2) : JSON.stringify(json);
      }
      if (!canParseJson) return "";
      return jsonToCsv(JSON.parse(input));
    } catch {
      return "";
    }
  }, [input, mode, pretty, canParseJson]);

  const rowCount = useMemo(() => {
    if (input.trim() === "") return 0;
    if (mode === "csv-to-json") {
      const json = csvToJson(input);
      return json.length;
    }
    try {
      const parsed: unknown = JSON.parse(input);
      return Array.isArray(parsed) ? parsed.length : 1;
    } catch {
      return 0;
    }
  }, [input, mode]);

  const error =
    mode === "json-to-csv" && !canParseJson && input.trim() !== ""
      ? "JSON معتبر نیست؛ پرانتزها، کاما و گیومه‌ها را بررسی کنید."
      : output === "" && input.trim() !== ""
        ? "ورودی قابل تبدیل نیست. ساختار را بررسی کنید."
        : null;

  function switchMode(next: Mode) {
    setMode(next);
    setInput(next === "csv-to-json" ? SAMPLE_CSV : SAMPLE_JSON);
  }

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <ToolPanel
        title={mode === "csv-to-json" ? "ورودی CSV" : "ورودی JSON"}
        description={
          mode === "csv-to-json"
            ? "خط اول به‌عنوان سرستون‌ها در نظر گرفته می‌شود"
            : "آرایه‌ای از آبجکت‌ها را وارد کنید"
        }
        icon={
          mode === "csv-to-json" ? (
            <FileSpreadsheet className="h-4 w-4 text-brand-600" aria-hidden="true" />
          ) : (
            <Braces className="h-4 w-4 text-brand-600" aria-hidden="true" />
          )
        }
        action={
          <div className="flex rounded-lg border border-ink-200 p-0.5">
            <button
              type="button"
              onClick={() => switchMode("csv-to-json")}
              aria-pressed={mode === "csv-to-json"}
              className={
                mode === "csv-to-json"
                  ? "rounded-md bg-brand-600 px-2 py-1 text-[10px] font-bold text-white"
                  : "rounded-md px-2 py-1 text-[10px] font-semibold text-ink-600"
              }
            >
              CSV → JSON
            </button>
            <button
              type="button"
              onClick={() => switchMode("json-to-csv")}
              aria-pressed={mode === "json-to-csv"}
              className={
                mode === "json-to-csv"
                  ? "rounded-md bg-brand-600 px-2 py-1 text-[10px] font-bold text-white"
                  : "rounded-md px-2 py-1 text-[10px] font-semibold text-ink-600"
              }
            >
              JSON → CSV
            </button>
          </div>
        }
      >
        <div className="space-y-3">
          <textarea
            value={input}
            onChange={(event) => setInput(event.target.value)}
            dir={mode === "json-to-csv" ? "ltr" : "rtl"}
            rows={14}
            spellCheck={false}
            data-testid="csv-json-input"
            className="w-full resize-y rounded-xl border border-ink-200 bg-ink-50/40 p-3 font-mono text-xs leading-6 outline-none focus:border-brand-400"
          />
          <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] text-ink-500">
            <span>
              {mode === "csv-to-json"
                ? `جداکننده: "${detectDelimiter(input)}"`
                : `${toPersianDigits(rowCount)} ردیف`}
            </span>
            {mode === "csv-to-json" && (
              <label className="flex items-center gap-1.5">
                <input
                  type="checkbox"
                  checked={pretty}
                  onChange={(event) => setPretty(event.target.checked)}
                  className="accent-brand-600"
                />
                خروجی مرتب (indent)
              </label>
            )}
          </div>
        </div>
      </ToolPanel>

      <ToolPanel
        title={mode === "csv-to-json" ? "خروجی JSON" : "خروجی CSV"}
        description="آمادهٔ کپی"
        icon={<Braces className="h-4 w-4 text-brand-600" aria-hidden="true" />}
        action={
          <span className="rounded-full bg-ink-100 px-2 py-1 text-[10px] font-semibold text-ink-600">
            {toPersianDigits(rowCount)} ردیف
          </span>
        }
      >
        {error ? (
          <p
            data-testid="csv-json-error"
            className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs leading-6 text-rose-700"
          >
            {error}
          </p>
        ) : (
          <textarea
            value={output}
            readOnly
            dir="ltr"
            rows={14}
            data-testid="csv-json-output"
            className="w-full resize-y rounded-xl border border-ink-200 bg-white p-3 font-mono text-xs leading-6 text-ink-900 outline-none"
          />
        )}
        <p className="mt-2 text-[11px] leading-6 text-ink-400">
          اعداد خودکار به number تبدیل می‌شوند؛ مقدار خالی، <code dir="ltr">true/false</code> و{" "}
          <code dir="ltr">null</code> هم تشخیص داده می‌شوند.
        </p>
      </ToolPanel>
    </div>
  );
}
