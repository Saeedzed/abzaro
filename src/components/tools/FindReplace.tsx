"use client";

import { useMemo, useState } from "react";
import { Plus, Replace, Trash2 } from "lucide-react";
import { applyReplaceRules } from "@/lib/text-tools";
import { toPersianDigits } from "@/lib/persian";
import { ToolPanel } from "./shared";

const MAX_RULES = 20;

interface RuleRow {
  id: number;
  find: string;
  replace: string;
}

/** پیدا و جایگزین چندگانه — قواعد به ترتیب اعمال می‌شوند. */
export function FindReplace() {
  const [text, setText] = useState("");
  const [ignoreCase, setIgnoreCase] = useState(false);
  const [rules, setRules] = useState<RuleRow[]>([
    { id: 1, find: "", replace: "" },
    { id: 2, find: "", replace: "" },
  ]);

  const result = useMemo(
    () =>
      applyReplaceRules(
        text,
        rules.map((rule) => ({ find: rule.find, replace: rule.replace })),
        { ignoreCase },
      ),
    [text, rules, ignoreCase],
  );

  const activeRules = rules.filter((rule) => rule.find !== "").length;

  function updateRule(id: number, patch: Partial<RuleRow>) {
    setRules((current) => current.map((rule) => (rule.id === id ? { ...rule, ...patch } : rule)));
  }

  function addRule() {
    setRules((current) =>
      current.length >= MAX_RULES
        ? current
        : [...current, { id: Date.now(), find: "", replace: "" }],
    );
  }

  function removeRule(id: number) {
    setRules((current) => (current.length <= 1 ? current : current.filter((rule) => rule.id !== id)));
  }

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <ToolPanel
        title="متن اصلی"
        description="متنی که می‌خواهید ویرایش شود"
        icon={<Replace className="h-4 w-4 text-brand-600" aria-hidden="true" />}
        action={
          <button
            type="button"
            onClick={() => setText("")}
            className="text-[11px] font-semibold text-ink-500 transition hover:text-rose-600"
          >
            پاک کردن
          </button>
        }
      >
        <textarea
          value={text}
          onChange={(event) => setText(event.target.value)}
          rows={12}
          data-testid="find-replace-input"
          placeholder="متن را اینجا بچسبانید…"
          className="w-full resize-y rounded-xl border border-ink-200 bg-ink-50/40 p-3 text-sm leading-7 outline-none focus:border-brand-400"
        />

        <div className="mt-3 space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold text-ink-700">
              قواعد جایگزینی ({toPersianDigits(activeRules)} فعال)
            </p>
            <label className="flex items-center gap-1.5 text-[11px] text-ink-600">
              <input
                type="checkbox"
                checked={ignoreCase}
                onChange={(event) => setIgnoreCase(event.target.checked)}
                className="accent-brand-600"
              />
              بی‌توجه به بزرگی/کوچکی حروف
            </label>
          </div>

          <div className="space-y-2" data-testid="find-replace-rules">
            {rules.map((rule, index) => (
              <div key={rule.id} className="flex items-center gap-1.5">
                <span className="w-4 shrink-0 text-center text-[10px] text-ink-400">
                  {toPersianDigits(index + 1)}
                </span>
                <input
                  value={rule.find}
                  onChange={(event) => updateRule(rule.id, { find: event.target.value })}
                  placeholder="پیدا"
                  className="min-w-0 flex-1 rounded-lg border border-ink-200 px-2 py-1.5 text-xs outline-none focus:border-brand-400"
                />
                <span className="text-ink-300">→</span>
                <input
                  value={rule.replace}
                  onChange={(event) => updateRule(rule.id, { replace: event.target.value })}
                  placeholder="جایگزین"
                  className="min-w-0 flex-1 rounded-lg border border-ink-200 px-2 py-1.5 text-xs outline-none focus:border-brand-400"
                />
                <button
                  type="button"
                  onClick={() => removeRule(rule.id)}
                  aria-label="حذف قاعده"
                  className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-ink-400 transition hover:bg-rose-50 hover:text-rose-600"
                >
                  <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                </button>
              </div>
            ))}
          </div>

          <button
            type="button"
            onClick={addRule}
            disabled={rules.length >= MAX_RULES}
            className="inline-flex items-center gap-1.5 rounded-lg border border-dashed border-ink-300 px-3 py-1.5 text-[11px] font-semibold text-ink-600 transition hover:border-brand-400 hover:text-brand-700 disabled:opacity-50"
          >
            <Plus className="h-3.5 w-3.5" aria-hidden="true" />
            افزودن قاعده
          </button>
        </div>
      </ToolPanel>

      <ToolPanel
        title="خروجی"
        description={`${toPersianDigits(result.replacements)} جایگزینی انجام شد`}
        icon={<Replace className="h-4 w-4 text-brand-600" aria-hidden="true" />}
        action={
          <button
            type="button"
            onClick={() => text && setText(result.output)}
            className="text-[11px] font-semibold text-brand-700 transition hover:text-brand-800"
          >
            اعمال روی متن
          </button>
        }
      >
        <textarea
          value={result.output}
          readOnly
          rows={12}
          data-testid="find-replace-output"
          className="w-full resize-y rounded-xl border border-ink-200 bg-white p-3 text-sm leading-7 text-ink-900 outline-none"
        />
        <p className="mt-2 text-[11px] leading-6 text-ink-400">
          قواعد از بالا به پایین اجرا می‌شوند، بنابراین ترتیب اهمیت دارد. جست‌وجو
          متنی است (نه regex) — کاراکترهای ویژه مثل نقطه و پرانتز معنی خاصی
          ندارند.
        </p>
      </ToolPanel>
    </div>
  );
}
