"use client";

import { useMemo, useState } from "react";
import { ArrowLeftRight, Ruler } from "lucide-react";
import { UNIT_GROUPS, convertUnit, formatUnitValue, type UnitGroupId } from "@/lib/units";
import { toEnglishDigits, toPersianDigits } from "@/lib/persian";
import { cn } from "@/lib/utils";

/**
 * Unit converter: length, mass, temperature, area, volume, speed and data.
 * All factors live in `lib/units.ts`, so adding a unit is a one-line change.
 */
export function UnitConverter() {
  const [groupId, setGroupId] = useState<UnitGroupId>("length");
  const group = UNIT_GROUPS.find((item) => item.id === groupId) ?? UNIT_GROUPS[0]!;

  const [fromId, setFromId] = useState(group.base);
  const [toId, setToId] = useState(group.units[1]?.id ?? group.base);
  const [input, setInput] = useState("1");

  function selectGroup(next: UnitGroupId) {
    setGroupId(next);
    const target = UNIT_GROUPS.find((item) => item.id === next);
    if (!target) return;
    setFromId(target.base);
    setToId(target.units.find((unit) => unit.id !== target.base)?.id ?? target.base);
  }

  const numeric = Number(toEnglishDigits(input).replace(/[,٬\s]/g, ""));
  const conversion = useMemo(
    () => convertUnit(numeric, fromId, toId, groupId),
    [numeric, fromId, toId, groupId],
  );

  const from = group.units.find((unit) => unit.id === fromId);
  const to = group.units.find((unit) => unit.id === toId);
  const isEmpty = input.trim() === "";

  const resultText =
    conversion.ok && !isEmpty ? formatUnitValue(conversion.value) : "";

  /* A compact "all units at once" table — the actual reason people use these */
  const allValues = group.units.map((unit) => {
    const converted = convertUnit(numeric, fromId, unit.id, groupId);
    return { unit, value: converted.ok ? formatUnitValue(converted.value) : "—" };
  });

  function swap() {
    setFromId(toId);
    setToId(fromId);
  }

  return (
    <div className="space-y-4">
      {/* group chips */}
      <div className="flex flex-wrap gap-2">
        {UNIT_GROUPS.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => selectGroup(item.id)}
            aria-pressed={groupId === item.id}
            data-testid={`unit-group-${item.id}`}
            className={cn(
              "rounded-full border px-3 py-1.5 text-xs font-medium transition",
              groupId === item.id
                ? "border-brand-600 bg-brand-600 text-white"
                : "border-ink-200 bg-white text-ink-600 hover:border-brand-300 hover:text-brand-700",
            )}
          >
            {item.title}
          </button>
        ))}
      </div>

      <div className="rounded-2xl border border-ink-200 bg-white p-4 shadow-card sm:p-5">
        <h3 className="flex items-center gap-2 text-base font-bold text-ink-900">
          <Ruler className="h-4 w-4 text-brand-600" aria-hidden="true" />
          تبدیل {group.title}
        </h3>

        <div className="mt-4 grid items-end gap-3 sm:grid-cols-[1fr_auto_1fr]">
          {/* from */}
          <div>
            <label htmlFor="unit-value" className="mb-1.5 block text-xs font-semibold text-ink-600">
              مقدار
            </label>
            <div className="flex gap-2">
              <input
                id="unit-value"
                dir="ltr"
                inputMode="decimal"
                value={input}
                onChange={(event) => setInput(event.target.value)}
                data-testid="unit-input"
                className="w-full rounded-xl border border-ink-200 bg-white px-3 py-2.5 text-left text-lg font-bold text-ink-900 outline-none transition focus:border-brand-400 focus:ring-4 focus:ring-brand-100"
              />
              <select
                aria-label="واحد مبدأ"
                value={fromId}
                onChange={(event) => setFromId(event.target.value)}
                data-testid="unit-from"
                className="w-28 shrink-0 rounded-xl border border-ink-200 bg-white px-2 py-2.5 text-xs text-ink-800 outline-none transition focus:border-brand-400"
              >
                {group.units.map((unit) => (
                  <option key={unit.id} value={unit.id}>
                    {unit.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <button
            type="button"
            onClick={swap}
            aria-label="جابه‌جایی واحدها"
            data-testid="unit-swap"
            className="mx-auto flex h-10 w-10 items-center justify-center rounded-xl border border-ink-200 bg-white text-ink-600 transition hover:border-brand-400 hover:text-brand-700"
          >
            <ArrowLeftRight className="h-4 w-4" aria-hidden="true" />
          </button>

          {/* to */}
          <div>
            <label htmlFor="unit-result" className="mb-1.5 block text-xs font-semibold text-ink-600">
              نتیجه
            </label>
            <div className="flex gap-2">
              <output
                id="unit-result"
                dir="ltr"
                data-testid="unit-result"
                className="flex w-full items-center rounded-xl border border-brand-200 bg-brand-50 px-3 py-2.5 text-left text-lg font-extrabold text-brand-800"
              >
                {resultText ? toPersianDigits(resultText) : "—"}
              </output>
              <select
                aria-label="واحد مقصد"
                value={toId}
                onChange={(event) => setToId(event.target.value)}
                data-testid="unit-to"
                className="w-28 shrink-0 rounded-xl border border-ink-200 bg-white px-2 py-2.5 text-xs text-ink-800 outline-none transition focus:border-brand-400"
              >
                {group.units.map((unit) => (
                  <option key={unit.id} value={unit.id}>
                    {unit.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {!conversion.ok && !isEmpty && (
          <p role="alert" className="mt-3 text-xs font-medium text-red-600">
            عدد معتبری وارد کنید (مثال: ۲۴ یا 3.5).
          </p>
        )}

        {from && to && resultText && (
          <p className="mt-3 rounded-xl bg-ink-50 px-3 py-2 text-center text-xs text-ink-600">
            {toPersianDigits(input)} {from.label} = {toPersianDigits(resultText)} {to.label}
          </p>
        )}
      </div>

      {/* everything at a glance */}
      <div className="rounded-2xl border border-ink-200 bg-white p-4 shadow-card sm:p-5">
        <h3 className="text-sm font-bold text-ink-900">همهٔ واحدهای {group.title}</h3>
        <ul className="mt-3 divide-y divide-ink-100" data-testid="unit-table">
          {allValues.map(({ unit, value }) => (
            <li key={unit.id} className="flex items-center justify-between gap-3 py-2">
              <span className="text-xs font-medium text-ink-700">{unit.label}</span>
              <span dir="ltr" className="text-xs font-bold text-ink-900">
                {isEmpty ? "—" : toPersianDigits(value)}{" "}
                <span className="font-normal text-ink-400">{unit.symbol}</span>
              </span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
