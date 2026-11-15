"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  ArrowRight,
  Check,
  Eye,
  EyeOff,
  Fingerprint,
  Loader2,
  Lock,
  Mail,
  ShieldCheck,
  Sparkles,
  User,
} from "lucide-react";

import { useSession } from "@/lib/use-session";
import {
  AUTH_ERRORS,
  cryptoAvailable,
  hasLocalAccounts,
  signIn,
  signUp,
  type AuthError,
} from "@/lib/local-auth";
import { toPersianDigits } from "@/lib/persian";

type Mode = "sign-in" | "sign-up";

const HIGHLIGHTS = [
  { icon: Fingerprint, text: "ابزارهای اخیر و ذخیره‌شده‌ی خودتان، جدا از بقیه" },
  { icon: ShieldCheck, text: "رمز با PBKDF2 و ۱۵۰٬۰۰۰ تکرار هش می‌شود، نه ذخیره" },
  { icon: Sparkles, text: "بدون آپلود، بدون ردیابی، بدون ایمیل تبلیغاتی" },
];

function Label({ children, htmlFor }: { children: React.ReactNode; htmlFor: string }) {
  return (
    <label htmlFor={htmlFor} className="mb-1.5 block text-xs font-semibold text-slate-600 dark:text-slate-400">
      {children}
    </label>
  );
}

function Field({
  id,
  type = "text",
  value,
  onChange,
  placeholder,
  icon: Icon,
  autoComplete,
  trailing,
}: {
  id: string;
  type?: string;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  icon: React.ComponentType<{ className?: string }>;
  autoComplete?: string;
  trailing?: React.ReactNode;
}) {
  return (
    <div className="relative">
      <Icon className="pointer-events-none absolute end-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
      <input
        id={id}
        name={id}
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        autoComplete={autoComplete}
        className="w-full rounded-xl border border-slate-200 bg-white/80 py-2.5 pe-10 ps-3 text-sm text-slate-900 shadow-sm outline-none transition placeholder:text-slate-400 focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 dark:border-slate-700 dark:bg-slate-800/80 dark:text-slate-100"
      />
      {trailing}
    </div>
  );
}

export default function AuthPanel({ initialMode = "sign-up" }: { initialMode?: Mode }) {
  const router = useRouter();
  const { session, ready } = useSession();
  const [mode, setMode] = useState<Mode>(initialMode);
  const [name, setName] = useState("");
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [existing, setExisting] = useState(false);
  const [secure, setSecure] = useState(true);

  useEffect(() => {
    setExisting(hasLocalAccounts());
    setSecure(cryptoAvailable());
    // Prefer the sign-in tab when this browser already has a profile.
    if (hasLocalAccounts()) setMode("sign-in");
  }, []);

  // Already signed in? Skip the form entirely.
  useEffect(() => {
    if (ready && session) router.replace("/dashboard");
  }, [ready, session, router]);

  const strength =
    password.length === 0 ? 0 : password.length < 8 ? 1 : password.length < 12 ? 2 : 3;

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    setBusy(true);
    const result =
      mode === "sign-up"
        ? await signUp({ name, identifier, password, confirm })
        : await signIn({ identifier, password });
    setBusy(false);

    if (result.ok) {
      router.replace("/dashboard");
      return;
    }
    setError(AUTH_ERRORS[result.error as AuthError] ?? "خطای نامشخص");
  }

  return (
    <div className="grid min-h-[calc(100vh-4rem)] lg:grid-cols-[1.05fr_1fr]">
      {/* ── left: the story (hidden on mobile, where the form is the point) ── */}
      <section className="relative hidden overflow-hidden bg-ink-900 p-10 text-white lg:flex lg:flex-col lg:justify-between">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 opacity-70"
          style={{
            background:
              "radial-gradient(circle at 15% 20%, rgba(16,185,129,.35), transparent 45%), radial-gradient(circle at 85% 10%, rgba(59,130,246,.30), transparent 40%), radial-gradient(circle at 60% 90%, rgba(168,85,247,.28), transparent 45%)",
          }}
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 opacity-[0.07]"
          style={{
            backgroundImage:
              "linear-gradient(to right, #fff 1px, transparent 1px), linear-gradient(to bottom, #fff 1px, transparent 1px)",
            backgroundSize: "44px 44px",
          }}
        />

        <div className="relative">
          <Link href="/" className="inline-flex items-center gap-2 text-sm font-bold text-white/90">
            ابزارو
            <span className="rounded-full bg-white/10 px-2 py-0.5 text-[10px] font-medium text-white/70">
              ۹۵ ابزار رایگان
            </span>
          </Link>

          <h1 className="mt-16 max-w-md text-3xl font-extrabold leading-[1.35]">
            پروفایل بسازید تا
            <span className="mx-1.5 bg-gradient-to-l from-emerald-300 to-brand-300 bg-clip-text text-transparent">
              ابزارهای خودتان
            </span>
            را دم دست داشته باشید.
          </h1>
          <p className="mt-4 max-w-sm text-sm leading-7 text-white/70">
            سایت هر بار از صفر شروع نمی‌شود: ابزارهایی که باز کردید و آن‌هایی که
            ذخیره کردید، در پروفایل خودتان می‌مانند.
          </p>

          <ul className="mt-8 space-y-3">
            {HIGHLIGHTS.map((item) => (
              <li key={item.text} className="flex items-start gap-3 text-sm text-white/80">
                <span className="mt-0.5 rounded-lg bg-white/10 p-1.5">
                  <item.icon className="h-4 w-4 text-emerald-300" />
                </span>
                {item.text}
              </li>
            ))}
          </ul>
        </div>

        <p className="relative max-w-sm text-[11px] leading-6 text-white/50">
          پروفایل روی همین مرورگر ساخته می‌شود؛ سایت سرور و پایگاه داده ندارد.
          یعنی نه ما به دادهٔ شما دسترسی داریم، نه چیزی بین دستگاه‌ها همگام می‌شود.
        </p>
      </section>

      {/* ── right: the form ── */}
      <section className="flex items-center justify-center px-5 py-8 sm:px-8">
        <div className="w-full max-w-sm">
          <div className="mb-6">
            <h2 className="text-xl font-extrabold text-slate-900 dark:text-slate-100">
              {mode === "sign-up" ? "ساخت پروفایل" : "ورود به پروفایل"}
            </h2>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
              {mode === "sign-up"
                ? "یک ایمیل یا شمارهٔ موبایل و یک رمز کافی است."
                : "با همان ایمیل/شماره‌ای که پروفایل ساختید وارد شوید."}
            </p>
          </div>

          {/* tabs */}
          <div
            role="tablist"
            aria-label="ورود یا ثبت‌نام"
            className="mb-6 grid grid-cols-2 gap-1 rounded-xl bg-slate-100 p-1 dark:bg-slate-800"
          >
            {(
              [
                ["sign-up", "ثبت‌نام"],
                ["sign-in", "ورود"],
              ] as Array<[Mode, string]>
            ).map(([value, label]) => (
              <button
                key={value}
                type="button"
                role="tab"
                aria-selected={mode === value}
                data-testid={`auth-tab-${value}`}
                onClick={() => {
                  setMode(value);
                  setError(null);
                }}
                className={`rounded-lg py-2 text-sm font-semibold transition ${
                  mode === value
                    ? "bg-white text-slate-900 shadow-sm dark:bg-slate-700 dark:text-white"
                    : "text-slate-500 hover:text-slate-700 dark:text-slate-400"
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          {!secure ? (
            <p className="mb-4 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-[11px] leading-5 text-amber-800">
              رمزنگاری WebCrypto در این صفحه فعال نیست (نیاز به https یا localhost).
            </p>
          ) : null}

          <form onSubmit={submit} className="space-y-4" data-testid="auth-form">
            {mode === "sign-up" ? (
              <div>
                <Label htmlFor="auth-name">نام</Label>
                <Field
                  id="auth-name"
                  value={name}
                  onChange={setName}
                  placeholder="مثلاً مهدی"
                  icon={User}
                  autoComplete="name"
                />
              </div>
            ) : null}

            <div>
              <Label htmlFor="auth-identifier">ایمیل یا شمارهٔ موبایل</Label>
              <Field
                id="auth-identifier"
                value={identifier}
                onChange={setIdentifier}
                placeholder="name@example.com یا ۰۹۱۲۳۴۵۶۷۸۹"
                icon={Mail}
                autoComplete="username"
              />
            </div>

            <div>
              <Label htmlFor="auth-password">رمز عبور</Label>
              <Field
                id="auth-password"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={setPassword}
                placeholder="دست‌کم ۸ کاراکتر"
                icon={Lock}
                autoComplete={mode === "sign-up" ? "new-password" : "current-password"}
                trailing={
                  <button
                    type="button"
                    aria-label={showPassword ? "پنهان کردن رمز" : "نمایش رمز"}
                    onClick={() => setShowPassword((value) => !value)}
                    className="absolute start-3 top-1/2 -translate-y-1/2 text-slate-400 transition hover:text-slate-600"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                }
              />
              {mode === "sign-up" && password.length > 0 ? (
                <div className="mt-2 flex items-center gap-1.5" aria-hidden="true">
                  {[1, 2, 3].map((step) => (
                    <span
                      key={step}
                      className={`h-1 flex-1 rounded-full transition ${
                        strength >= step
                          ? strength === 1
                            ? "bg-rose-400"
                            : strength === 2
                              ? "bg-amber-400"
                              : "bg-emerald-500"
                          : "bg-slate-200 dark:bg-slate-700"
                      }`}
                    />
                  ))}
                  <span className="w-16 text-end text-[10px] text-slate-400">
                    {strength === 1 ? "کوتاه" : strength === 2 ? "خوب" : "قوی"}
                  </span>
                </div>
              ) : null}
            </div>

            {mode === "sign-up" ? (
              <div>
                <Label htmlFor="auth-confirm">تکرار رمز عبور</Label>
                <Field
                  id="auth-confirm"
                  type={showPassword ? "text" : "password"}
                  value={confirm}
                  onChange={setConfirm}
                  placeholder="همان رمز را دوباره بنویسید"
                  icon={Lock}
                  autoComplete="new-password"
                />
              </div>
            ) : null}

            {error ? (
              <p
                role="alert"
                data-testid="auth-error"
                className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs leading-5 text-rose-700"
              >
                {error}
              </p>
            ) : null}

            <button
              type="submit"
              disabled={busy}
              data-testid="auth-submit"
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-brand-600 py-2.5 text-sm font-bold text-white shadow-sm transition hover:bg-brand-700 disabled:opacity-60"
            >
              {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              {mode === "sign-up" ? "ساخت پروفایل" : "ورود"}
              {!busy ? <ArrowRight className="h-4 w-4" /> : null}
            </button>
          </form>

          <p className="mt-4 flex items-start gap-1.5 text-[11px] leading-5 text-slate-500 dark:text-slate-400">
            <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-500" />
            {existing
              ? "روی این مرورگر پروفایل وجود دارد؛ با همان ایمیل/شماره وارد شوید."
              : "حساب روی همین مرورگر ساخته می‌شود و به هیچ سروری فرستاده نمی‌شود."}
          </p>

          <p className="mt-6 text-center text-[11px] leading-6 text-slate-400">
            <Link href="/privacy" className="underline decoration-dotted hover:text-slate-600">
              حریم خصوصی
            </Link>
            {" · "}
            <Link href="/tools" className="underline decoration-dotted hover:text-slate-600">
              {toPersianDigits(80)} ابزار بدون ثبت‌نام هم کار می‌کنند
            </Link>
          </p>
        </div>
      </section>
    </div>
  );
}
