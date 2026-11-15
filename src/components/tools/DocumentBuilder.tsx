"use client";

import { useCallback, useMemo, useState } from "react";

import { todayJalali } from "@/lib/jalali";
import { buildPdf, downloadPdf, type DocSpec } from "@/lib/pdf-builder";
import { toPersianDigits } from "@/lib/persian";

const fa = (value: string | number) => toPersianDigits(String(value));

export type DocKind = "invoice" | "resume" | "letter" | "lease" | "experience";

interface Field {
  id: string;
  label: string;
  placeholder?: string;
  type?: "text" | "number" | "textarea" | "date";
  rows?: number;
  required?: boolean;
  /** Column layout hint. */
  span?: 1 | 2;
}

interface ItemColumn {
  id: string;
  label: string;
  numeric?: boolean;
}

interface BuilderConfig {
  title: string;
  subtitle: string;
  fields: Field[];
  /** Optional line-item table (invoice). */
  items?: { columns: ItemColumn[]; addLabel: string };
  /** Extra free-text sections after the table. */
  notesField?: Field;
}

export const CONFIGS: Record<DocKind, BuilderConfig> = {
  invoice: {
    title: "سازندهٔ فاکتور و رسید فروش",
    subtitle: "فاکتور فارسی با محاسبهٔ خودکار جمع، تخفیف و مالیات — خروجی PDF",
    fields: [
      { id: "seller", label: "فروشنده / شرکت", placeholder: "فروشگاه نمونه", required: true },
      { id: "sellerInfo", label: "نشانی و تلفن فروشنده", placeholder: "تهران، خیابان … — ۰۲۱۱۲۳۴۵۶۷۸", span: 2 },
      { id: "buyer", label: "خریدار", placeholder: "نام خریدار", required: true },
      { id: "buyerInfo", label: "نشانی خریدار" },
      { id: "number", label: "شمارهٔ فاکتور", placeholder: "۱۴۰۵-۰۰۱" },
      { id: "date", label: "تاریخ (شمسی)", type: "date" },
      { id: "discount", label: "تخفیف (تومان)", type: "number", placeholder: "0" },
      { id: "tax", label: "مالیات بر ارزش افزوده (٪)", type: "number", placeholder: "10" },
      { id: "notes", label: "توضیحات", type: "textarea", rows: 2, span: 2 },
    ],
    items: {
      addLabel: "افزودن ردیف",
      columns: [
        { id: "name", label: "شرح کالا یا خدمت" },
        { id: "qty", label: "تعداد", numeric: true },
        { id: "price", label: "قیمت واحد", numeric: true },
      ],
    },
    notesField: { id: "notes", label: "توضیحات", type: "textarea", rows: 2, span: 2 },
  },
  resume: {
    title: "سازندهٔ رزومه",
    subtitle: "رزومهٔ فارسی تمیز در یک صفحه — بدون ثبت‌نام، خروجی PDF",
    fields: [
      { id: "name", label: "نام و نام خانوادگی", required: true },
      { id: "role", label: "عنوان شغلی", placeholder: "کارشناس بازاریابی دیجیتال" },
      { id: "phone", label: "تلفن" },
      { id: "email", label: "ایمیل" },
      { id: "city", label: "شهر" },
      { id: "links", label: "لینک (لینکدین / نمونه‌کار)" },
      { id: "summary", label: "خلاصهٔ حرفه‌ای", type: "textarea", rows: 3, span: 2 },
      { id: "experience", label: "سوابق شغلی", type: "textarea", rows: 5, span: 2, placeholder: "۱۴۰۲–اکنون — کارشناس بازاریابی، شرکت الف\n۱۴۰۰–۱۴۰۲ — کارآموز، شرکت ب" },
      { id: "education", label: "تحصیلات", type: "textarea", rows: 3, span: 2, placeholder: "کارشناسی مدیریت بازرگانی، دانشگاه تهران، ۱۴۰۰" },
      { id: "skills", label: "مهارت‌ها", type: "textarea", rows: 2, span: 2, placeholder: "تحلیل داده، سئو، اکسل، نوشتن محتوا" },
    ],
  },
  letter: {
    title: "سازندهٔ نامهٔ اداری",
    subtitle: "نامهٔ اداری با قالب استاندارد فارسی — خروجی PDF",
    fields: [
      { id: "from", label: "فرستنده", placeholder: "شرکت نمونه", required: true },
      { id: "to", label: "گیرنده", placeholder: "مدیریت محترم …", required: true },
      { id: "subject", label: "موضوع", placeholder: "درخواست مرخصی", span: 2 },
      { id: "number", label: "شمارهٔ نامه" },
      { id: "date", label: "تاریخ (شمسی)", type: "date" },
      { id: "attachment", label: "پیوست" },
      { id: "body", label: "متن نامه", type: "textarea", rows: 8, span: 2, required: true, placeholder: "با سلام و احترام،\nبه استحضار می‌رساند که …" },
      { id: "signer", label: "امضاکننده", placeholder: "نام و سمت" },
    ],
  },
  lease: {
    title: "سازندهٔ قرارداد اجاره",
    subtitle: "قرارداد اجارهٔ مسکونی با بندهای پایه — قابل ویرایش و چاپ",
    fields: [
      { id: "landlord", label: "موجر (مالک)", required: true },
      { id: "tenant", label: "مستأجر", required: true },
      { id: "property", label: "نشانی ملک", type: "textarea", rows: 2, span: 2, required: true },
      { id: "area", label: "متراژ (متر مربع)", type: "number" },
      { id: "rooms", label: "تعداد اتاق", type: "number" },
      { id: "rent", label: "اجارهٔ ماهانه (تومان)", type: "number", required: true },
      { id: "deposit", label: "ودیعه (تومان)", type: "number" },
      { id: "start", label: "تاریخ شروع (شمسی)", type: "date", placeholder: "۱۴۰۵/۰۹/۰۱" },
      { id: "months", label: "مدت (ماه)", type: "number" },
      { id: "extra", label: "شرایط اضافه", type: "textarea", rows: 3, span: 2 },
    ],
  },
  experience: {
    title: "سازندهٔ گواهی سابقهٔ کار",
    subtitle: "گواهی اشتغال با مهر و امضا برای ارائه به مراجع — خروجی PDF",
    fields: [
      { id: "company", label: "نام شرکت", required: true },
      { id: "companyInfo", label: "نشانی و شناسهٔ شرکت", span: 2 },
      { id: "name", label: "نام و نام خانوادگی", required: true },
      { id: "nationalId", label: "کد ملی" },
      { id: "role", label: "عنوان شغلی" },
      { id: "department", label: "واحد سازمانی" },
      { id: "start", label: "تاریخ شروع (شمسی)", type: "date", placeholder: "۱۴۰۵/۰۹/۰۱" },
      { id: "end", label: "تاریخ پایان (شمسی)", type: "date", placeholder: "۱۴۰۵/۰۹/۰۱" },
      { id: "purpose", label: "جهت ارائه به", placeholder: "سفارتخانه / بانک / دانشگاه", span: 2 },
      { id: "signer", label: "امضاکننده", placeholder: "مدیر منابع انسانی" },
    ],
  },
};

/** Today in Jalali, e.g. ۱۴۰۵/۰۸/۲۴ — documents are Persian, so are the dates. */
function todayJalaliString(): string {
  const today = todayJalali();
  return `${today.jy}/${String(today.jm).padStart(2, "0")}/${String(today.jd).padStart(2, "0")}`;
}

interface Item {
  name: string;
  qty: string;
  price: string;
}

export default function DocumentBuilder({ kind }: { kind: DocKind }) {
  const config = CONFIGS[kind];
  const [values, setValues] = useState<Record<string, string>>(() => {
    const initial: Record<string, string> = {};
    for (const field of config.fields) initial[field.id] = field.type === "date" ? todayJalaliString() : "";
    return initial;
  });
  const [items, setItems] = useState<Item[]>([{ name: "", qty: "1", price: "" }]);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const set = (id: string, value: string) => setValues((prev) => ({ ...prev, [id]: value }));

  const totals = useMemo(() => {
    const rows = items.map((item) => ({
      ...item,
      total: (Number(item.qty) || 0) * (Number(item.price) || 0),
    }));
    const subtotal = rows.reduce((sum, row) => sum + row.total, 0);
    const discount = Number(values.discount) || 0;
    const taxRate = Number(values.tax) || 0;
    const afterDiscount = Math.max(0, subtotal - discount);
    const tax = Math.round((afterDiscount * taxRate) / 100);
    return { rows, subtotal, discount, tax, grand: afterDiscount + tax };
  }, [items, values.discount, values.tax]);

  const money = (value: number) => fa(value.toLocaleString("en-US"));

  const build = useCallback(async () => {
    const missing = config.fields.filter((f) => f.required && !values[f.id]?.trim());
    if (missing.length > 0) {
      setError(`این فیلدها لازم‌اند: ${missing.map((f) => f.label).join("، ")}`);
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const spec = buildSpec(kind, values, totals, money);
      const bytes = await buildPdf(spec);
      downloadPdf(bytes, `${kind}-${Date.now()}.pdf`);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : String(cause));
    } finally {
      setBusy(false);
    }
  }, [config.fields, kind, items, money, totals, values]);

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-700 dark:bg-slate-900">
        <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">{config.title}</h3>
        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{config.subtitle}</p>

        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          {config.fields.map((field) => (
            <label key={field.id} className={`block ${field.span === 2 ? "sm:col-span-2" : ""}`}>
              <span className="mb-1 block text-xs font-medium text-slate-600 dark:text-slate-400">
                {field.label}
                {field.required ? <span className="text-rose-600"> *</span> : null}
              </span>
              {field.type === "textarea" ? (
                <textarea
                  data-testid={`doc-${field.id}`}
                  value={values[field.id] ?? ""}
                  rows={field.rows ?? 3}
                  placeholder={field.placeholder}
                  onChange={(event) => set(field.id, event.target.value)}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
                />
              ) : (
                <input
                  data-testid={`doc-${field.id}`}
                  type={field.type === "number" ? "number" : "text"}
                  inputMode={field.type === "number" || field.type === "date" ? "numeric" : undefined}
                  value={values[field.id] ?? ""}
                  placeholder={field.placeholder}
                  onChange={(event) => set(field.id, event.target.value)}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
                />
              )}
            </label>
          ))}
        </div>

        {config.items ? (
          <div className="mt-5">
            <h4 className="mb-2 text-sm font-bold text-slate-800 dark:text-slate-200">ردیف‌های فاکتور</h4>
            <div className="space-y-2">
              {items.map((item, index) => (
                <div key={index} className="grid grid-cols-[1fr_70px_110px_34px] gap-2">
                  <input
                    data-testid={`doc-item-name-${index}`}
                    value={item.name}
                    placeholder={config.items!.columns[0]!.label}
                    onChange={(event) =>
                      setItems((prev) => prev.map((row, i) => (i === index ? { ...row, name: event.target.value } : row)))
                    }
                    className="rounded-lg border border-slate-300 px-2 py-1.5 text-sm dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
                  />
                  <input
                    data-testid={`doc-item-qty-${index}`}
                    value={item.qty}
                    inputMode="numeric"
                    onChange={(event) =>
                      setItems((prev) => prev.map((row, i) => (i === index ? { ...row, qty: event.target.value } : row)))
                    }
                    className="rounded-lg border border-slate-300 px-2 py-1.5 text-sm dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
                  />
                  <input
                    data-testid={`doc-item-price-${index}`}
                    value={item.price}
                    inputMode="numeric"
                    placeholder="قیمت"
                    onChange={(event) =>
                      setItems((prev) => prev.map((row, i) => (i === index ? { ...row, price: event.target.value } : row)))
                    }
                    className="rounded-lg border border-slate-300 px-2 py-1.5 text-sm dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
                  />
                  <button
                    type="button"
                    aria-label="حذف ردیف"
                    onClick={() => setItems((prev) => (prev.length > 1 ? prev.filter((_, i) => i !== index) : prev))}
                    className="rounded-lg bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
            <button
              type="button"
              data-testid="doc-add-item"
              onClick={() => setItems((prev) => [...prev, { name: "", qty: "1", price: "" }])}
              className="mt-2 rounded-lg bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-700 dark:bg-slate-800 dark:text-slate-300"
            >
              {config.items.addLabel}
            </button>

            <dl data-testid="doc-totals" className="mt-3 grid grid-cols-2 gap-2 rounded-xl bg-slate-50 p-3 text-sm dark:bg-slate-800/60">
              <dt className="text-slate-600 dark:text-slate-400">جمع کل</dt>
              <dd className="text-end font-semibold">{money(totals.subtotal)} تومان</dd>
              <dt className="text-slate-600 dark:text-slate-400">تخفیف</dt>
              <dd className="text-end font-semibold">{money(totals.discount)} تومان</dd>
              <dt className="text-slate-600 dark:text-slate-400">مالیات</dt>
              <dd className="text-end font-semibold">{money(totals.tax)} تومان</dd>
              <dt className="font-bold text-slate-900 dark:text-slate-100">قابل پرداخت</dt>
              <dd data-testid="doc-grand" className="text-end font-bold text-emerald-700 dark:text-emerald-400">
                {money(totals.grand)} تومان
              </dd>
            </dl>
          </div>
        ) : null}

        <button
          type="button"
          data-testid="doc-build"
          onClick={() => void build()}
          disabled={busy}
          className="mt-5 w-full rounded-xl bg-emerald-600 px-4 py-3 text-sm font-bold text-white hover:bg-emerald-700 disabled:bg-slate-300 dark:disabled:bg-slate-700"
        >
          {busy ? "در حال ساخت PDF…" : "ساخت PDF"}
        </button>
        <p data-testid="doc-done" className="mt-2 hidden text-center text-xs text-emerald-700 dark:text-emerald-400">
          PDF ساخته شد و دانلود شد.
        </p>
        {error ? (
          <p data-testid="doc-error" className="mt-3 rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700 dark:bg-rose-950/40 dark:text-rose-300">
            {error}
          </p>
        ) : null}
      </section>

      <p className="rounded-2xl border border-slate-200 bg-white p-4 text-xs leading-6 text-slate-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-400">
        فونت فارسی (وزیرمتن، مجوز آزاد) داخل فایل جاسازی می‌شود، پس PDF روی هر کامپیوتری
        درست نمایش داده می‌شود. این سازنده قالب پایه می‌دهد، نه مشاورهٔ حقوقی: برای قرارداد
        مهم، متن را با یک وکیل بررسی کنید.
      </p>
    </div>
  );
}

interface Totals {
  rows: Array<Item & { total: number }>;
  subtotal: number;
  discount: number;
  tax: number;
  grand: number;
}

/** Turn the form state into a document spec. */
function buildSpec(
  kind: DocKind,
  values: Record<string, string>,
  totals: Totals,
  money: (value: number) => string,
): DocSpec {
  const v = (id: string) => values[id]?.trim() ?? "";

  if (kind === "invoice") {
    return {
      title: "فاکتور فروش",
      subtitle: [v("number") && `شمارهٔ ${v("number")}`, v("date") && `تاریخ ${v("date")}`]
        .filter(Boolean)
        .join("  ·  "),
      sections: [
        {
          heading: "فروشنده",
          lines: [{ text: v("seller"), bold: true }, { text: v("sellerInfo"), scale: 0.9 }],
        },
        {
          heading: "خریدار",
          lines: [{ text: v("buyer"), bold: true }, { text: v("buyerInfo"), scale: 0.9 }],
        },
      ],
      tables: [
        {
          headers: ["شرح", "تعداد", "قیمت واحد", "جمع"],
          widths: [4, 1, 2, 2],
          rows: totals.rows
            .filter((row) => row.name.trim() !== "")
            .map((row) => [row.name, row.qty, money(Number(row.price) || 0), money(row.total)]),
        },
      ],
      footer: `ابزارو — قابل پرداخت: ${money(totals.grand)} تومان`,
    };
  }

  if (kind === "resume") {
    return {
      title: v("name"),
      subtitle: [v("role"), v("phone"), v("email"), v("city"), v("links")].filter(Boolean).join("  ·  "),
      sections: [
        ...(v("summary") ? [{ heading: "خلاصهٔ حرفه‌ای", lines: [{ text: v("summary") }] }] : []),
        ...(v("experience")
          ? [{ heading: "سوابق شغلی", lines: v("experience").split("\n").map((line) => ({ text: line })) }]
          : []),
        ...(v("education")
          ? [{ heading: "تحصیلات", lines: v("education").split("\n").map((line) => ({ text: line })) }]
          : []),
        ...(v("skills") ? [{ heading: "مهارت‌ها", lines: [{ text: v("skills") }] }] : []),
      ],
      footer: "ساخته‌شده با ابزارو — ابزار آنلاین رایگان",
    };
  }

  if (kind === "letter") {
    return {
      title: v("subject") || "نامهٔ اداری",
      subtitle: [
        v("number") && `شماره: ${v("number")}`,
        v("date") && `تاریخ: ${v("date")}`,
        v("attachment") && `پیوست: ${v("attachment")}`,
      ]
        .filter(Boolean)
        .join("  ·  "),
      sections: [
        { heading: "فرستنده", lines: [{ text: v("from") }] },
        { heading: "گیرنده", lines: [{ text: v("to") }] },
        { lines: [{ text: v("body") }] },
        ...(v("signer")
          ? [{ lines: [{ text: "", spaceBefore: 2 }, { text: `با احترام، ${v("signer")}`, bold: true }] }]
          : []),
      ],
      footer: "این نامه با ابزارو ساخته شده است.",
    };
  }

  if (kind === "lease") {
    return {
      title: "قرارداد اجارهٔ مسکونی",
      subtitle: `تاریخ تنظیم: ${v("start") || "—"}`,
      sections: [
        {
          heading: "طرفین",
          lines: [
            { text: `موجر: ${v("landlord")}` },
            { text: `مستأجر: ${v("tenant")}` },
          ],
        },
        {
          heading: "موضوع قرارداد",
          lines: [
            { text: `ملک مورد اجاره با نشانی: ${v("property")}` },
            {
              text: [
                v("area") && `متراژ: ${v("area")} متر مربع`,
                v("rooms") && `تعداد اتاق: ${v("rooms")}`,
              ]
                .filter(Boolean)
                .join("  ·  "),
            },
          ],
        },
        {
          heading: "مدت و مبلغ",
          lines: [
            { text: `مدت اجاره: ${v("months") || "—"} ماه از تاریخ ${v("start") || "—"}` },
            { text: `اجارهٔ ماهانه: ${money(Number(v("rent")) || 0)} تومان`, bold: true },
            { text: `ودیعه: ${money(Number(v("deposit")) || 0)} تومان` },
          ],
        },
        {
          heading: "شرایط",
          lines: [
            { text: "۱) مستأجر متعهد است ملک را در استفادهٔ متعارف نگه دارد." },
            { text: "۲) پرداخت اجاره‌بها تا پایان هر ماه انجام می‌شود." },
            { text: "۳) تغییرات ساختمانی با اجازهٔ کتبی موجر مجاز است." },
            ...(v("extra") ? [{ text: v("extra") }] : []),
          ],
        },
        {
          lines: [
            { text: "", spaceBefore: 2 },
            { text: "امضای موجر: ____________________          امضای مستأجر: ____________________" },
          ],
        },
      ],
      footer: "این متن نمونه است و مشاورهٔ حقوقی نیست؛ پیش از امضا با وکیل مشورت کنید.",
    };
  }

  return {
    title: "گواهی سابقهٔ کار",
    subtitle: [v("company"), v("companyInfo")].filter(Boolean).join("  ·  "),
    sections: [
      {
        lines: [
          { text: "بدین‌وسیله گواهی می‌شود:", bold: true, spaceBefore: 1 },
          { text: `آقای/خانم ${v("name")}${v("nationalId") ? ` با کد ملی ${v("nationalId")}` : ""}` },
          {
            text: [
              v("role") && `در سمت ${v("role")}`,
              v("department") && `در واحد ${v("department")}`,
            ]
              .filter(Boolean)
              .join(" ") + ` در این شرکت مشغول به کار بوده است.`,
          },
          { text: `مدت اشتغال: از ${v("start") || "—"} تا ${v("end") || "—"}` },
          ...(v("purpose") ? [{ text: `این گواهی بنا به درخواست ایشان جهت ارائه به ${v("purpose")} صادر شده است.` }] : []),
        ],
      },
      {
        lines: [
          { text: "", spaceBefore: 2 },
          { text: `مهر و امضا: ${v("signer") || v("company")}` },
          { text: "____________________", spaceBefore: 1 },
        ],
      },
    ],
    footer: "صادرشده با ابزارو — ابزار آنلاین رایگان",
  };
}
