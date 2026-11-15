"use client";

import { useCallback, useState } from "react";

import {
  decryptPdf,
  encryptPdf,
  isEncrypted,
  MIN_PASSWORD_LENGTH,
  pageCount,
  passwordProblem,
} from "@/lib/pdf-crypt";
import { formatBytes } from "@/lib/image";
import { toPersianDigits } from "@/lib/persian";

const fa = (value: number | string) => toPersianDigits(String(value));

type Mode = "encrypt" | "decrypt";

interface Props {
  mode: Mode;
}

function download(bytes: Uint8Array, name: string) {
  const blob = new Blob([new Uint8Array(bytes)], { type: "application/pdf" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = name;
  link.click();
  URL.revokeObjectURL(url);
}

export default function PdfPassword({ mode }: Props) {
  const [file, setFile] = useState<File | null>(null);
  const [bytes, setBytes] = useState<Uint8Array | null>(null);
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<Uint8Array | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  const onFile = useCallback(
    async (selected: File | null) => {
      setResult(null);
      setError(null);
      setInfo(null);
      setFile(selected);
      if (!selected) {
        setBytes(null);
        return;
      }
      const buffer = new Uint8Array(await selected.arrayBuffer());
      setBytes(buffer);
      if (mode === "decrypt") {
        const encrypted = await isEncrypted(buffer);
        const pages = await pageCount(buffer);
        setInfo(
          encrypted
            ? "این فایل رمز دارد؛ رمز فعلی را وارد کنید."
            : "این فایل رمز ندارد و بدون رمز باز می‌شود — لازم نیست کاری کنید.",
        );
        if (!encrypted && pages !== null) {
          setInfo(`این فایل رمز ندارد (${fa(pages)} صفحه) — رمزگذاری‌شده نیست.`);
        }
      } else {
        const pages = await pageCount(buffer);
        setInfo(pages === null ? "این فایل از قبل رمز دارد؛ برای رمزگذاری دوباره ابتدا رمز را بردارید." : `${fa(pages)} صفحه`);
      }
    },
    [mode],
  );

  const run = useCallback(async () => {
    if (!bytes || !file) return;
    const problem = passwordProblem(password);
    if (problem) {
      setError(problem);
      return;
    }
    setBusy(true);
    setError(null);
    setResult(null);
    try {
      const output =
        mode === "encrypt"
          ? await encryptPdf(bytes, password)
          : await decryptPdf(bytes, password);
      setResult(output.bytes);
    } catch (cause) {
      const message = cause instanceof Error ? cause.message : String(cause);
      setError(
        /password/i.test(message) && mode === "decrypt"
          ? "رمز درست نیست. PDF بدون رمز صحیح باز نمی‌شود — ما رمز را حدس نمی‌زنیم یا نمی‌شکنیم."
          : message,
      );
    } finally {
      setBusy(false);
    }
  }, [bytes, file, mode, password]);

  const title = mode === "encrypt" ? "رمزگذاری PDF" : "حذف رمز PDF";

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-700 dark:bg-slate-900">
        <label className="block">
          <span className="mb-2 block text-sm font-semibold text-slate-700 dark:text-slate-300">
            فایل PDF
          </span>
          <input
            type="file"
            accept="application/pdf,.pdf"
            data-testid="pdf-crypt-file"
            onChange={(event) => void onFile(event.target.files?.[0] ?? null)}
            className="block w-full cursor-pointer rounded-lg border border-dashed border-slate-300 bg-slate-50 px-3 py-6 text-sm text-slate-600 file:me-3 file:rounded-md file:border-0 file:bg-emerald-600 file:px-3 file:py-1.5 file:text-white dark:border-slate-600 dark:bg-slate-800 dark:text-slate-300"
          />
        </label>

        {info ? (
          <p data-testid="pdf-crypt-info" className="mt-3 rounded-lg bg-slate-50 px-3 py-2 text-sm text-slate-600 dark:bg-slate-800/60 dark:text-slate-300">
            {info}
          </p>
        ) : null}

        <div className="mt-4">
          <label className="block">
            <span className="mb-2 block text-sm font-semibold text-slate-700 dark:text-slate-300">
              {mode === "encrypt" ? "رمز جدید" : "رمز فعلی فایل"}
            </span>
            <div className="flex gap-2">
              <input
                type={showPassword ? "text" : "password"}
                data-testid="pdf-crypt-password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder={`حداقل ${fa(MIN_PASSWORD_LENGTH)} نویسه`}
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="shrink-0 rounded-lg bg-slate-100 px-3 text-xs font-semibold text-slate-700 dark:bg-slate-800 dark:text-slate-300"
              >
                {showPassword ? "پنهان" : "نمایش"}
              </button>
            </div>
          </label>
          {mode === "encrypt" ? (
            <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
              رمز را جایی امن نگه دارید: بدون آن فایل باز نمی‌شود و ما رمز را ذخیره
              نمی‌کنیم (همه‌چیز در مرورگر خودتان اجرا می‌شود).
            </p>
          ) : (
            <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
              رمز باید همان رمزی باشد که فایل با آن باز می‌شود. اگر رمز را نمی‌دانید، این
              ابزار کمکی نمی‌کند.
            </p>
          )}
        </div>

        <button
          type="button"
          data-testid="pdf-crypt-run"
          onClick={() => void run()}
          disabled={!file || busy}
          className="mt-4 w-full rounded-xl bg-emerald-600 px-4 py-3 text-sm font-bold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-slate-300 dark:disabled:bg-slate-700"
        >
          {busy ? "در حال انجام…" : title}
        </button>

        {error ? (
          <p data-testid="pdf-crypt-error" className="mt-3 rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700 dark:bg-rose-950/40 dark:text-rose-300">
            {error}
          </p>
        ) : null}
      </section>

      {result && file ? (
        <section
          data-testid="pdf-crypt-result"
          className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5 dark:border-emerald-800 dark:bg-emerald-950/30"
        >
          <p className="text-sm font-semibold text-emerald-900 dark:text-emerald-200">
            {mode === "encrypt" ? "فایل رمزگذاری شد" : "رمز برداشته شد"}
          </p>
          <p
            data-testid="pdf-crypt-size"
            className="mt-1 text-xs text-slate-600 dark:text-slate-400"
          >
            {formatBytes(result.byteLength)} — {fa(result.byteLength.toLocaleString("en-US"))} بایت
          </p>
          <button
            type="button"
            data-testid="pdf-crypt-download"
            onClick={() =>
              download(result, file.name.replace(/\.pdf$/i, "") + (mode === "encrypt" ? "-locked.pdf" : "-unlocked.pdf"))
            }
            className="mt-3 rounded-xl bg-emerald-700 px-4 py-2 text-sm font-bold text-white hover:bg-emerald-800"
          >
            دانلود فایل
          </button>
        </section>
      ) : null}

      <section className="rounded-2xl border border-slate-200 bg-white p-5 text-xs leading-6 text-slate-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-400">
        <h3 className="mb-2 text-sm font-bold text-slate-900 dark:text-slate-100">
          چه اتفاقی می‌افتد؟
        </h3>
        <p>
          رمزگذاری با الگوریتم استاندارد امنیتی PDF انجام می‌شود (همان چیزی که Acrobat
          استفاده می‌کند). فایل شما هیچ‌وقت از مرورگر خارج نمی‌شود؛ کتابخانهٔ رمزگذاری در
          همین صفحه بارگذاری می‌شود و خروجی مستقیماً ذخیره می‌شود.
        </p>
      </section>
    </div>
  );
}
