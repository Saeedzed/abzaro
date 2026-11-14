"use client";

import { useState } from "react";
import { Send } from "lucide-react";
import { siteConfig } from "@/config/site";
import { cn } from "@/lib/utils";

interface FormState {
  name: string;
  email: string;
  subject: string;
  message: string;
}

type FormErrors = Partial<Record<keyof FormState, string>>;

const inputClassName =
  "w-full rounded-xl border border-ink-200 bg-ink-50/50 px-4 py-2.5 text-sm text-ink-900 outline-none transition placeholder:text-ink-400 focus:border-brand-400 focus:bg-white focus:ring-4 focus:ring-brand-100";

function Field({
  id,
  label,
  error,
  children,
}: {
  id: string;
  label: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label htmlFor={id} className="mb-1.5 block text-sm font-semibold text-ink-800">
        {label}
      </label>
      {children}
      {error && (
        <p role="alert" className="mt-1.5 text-xs font-medium text-red-600">
          {error}
        </p>
      )}
    </div>
  );
}

/**
 * Contact form. There is no backend in the MVP, so submitting opens the
 * visitor's own email client with a pre-filled message to the Abzaro team —
 * nothing is stored on any server.
 */
export function ContactForm() {
  const [form, setForm] = useState<FormState>({
    name: "",
    email: "",
    subject: "",
    message: "",
  });
  const [errors, setErrors] = useState<FormErrors>({});

  function update(field: keyof FormState, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: undefined }));
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const nextErrors: FormErrors = {};
    if (!form.name.trim()) nextErrors.name = "نام را وارد کنید.";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) {
      nextErrors.email = "ایمیل معتبر وارد کنید.";
    }
    if (!form.subject.trim()) nextErrors.subject = "موضوع را وارد کنید.";
    if (form.message.trim().length < 10) {
      nextErrors.message = "پیام باید حداقل ۱۰ کاراکتر باشد.";
    }
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    const body = `نام: ${form.name}\nایمیل: ${form.email}\n\n${form.message}`;
    const mailto = `mailto:${siteConfig.email}?subject=${encodeURIComponent(
      form.subject,
    )}&body=${encodeURIComponent(body)}`;
    window.location.href = mailto;
  }

  return (
    <form
      onSubmit={handleSubmit}
      noValidate
      className="space-y-5 rounded-2xl border border-ink-200 bg-white p-6 shadow-card sm:p-8"
    >
      <div className="grid gap-5 sm:grid-cols-2">
        <Field id="contact-name" label="نام" error={errors.name}>
          <input
            id="contact-name"
            type="text"
            autoComplete="name"
            value={form.name}
            onChange={(event) => update("name", event.target.value)}
            placeholder="نام شما"
            className={cn(inputClassName, errors.name && "border-red-300")}
          />
        </Field>
        <Field id="contact-email" label="ایمیل" error={errors.email}>
          <input
            id="contact-email"
            type="email"
            dir="ltr"
            autoComplete="email"
            value={form.email}
            onChange={(event) => update("email", event.target.value)}
            placeholder="you@example.com"
            className={cn(
              inputClassName,
              "text-left",
              errors.email && "border-red-300",
            )}
          />
        </Field>
      </div>

      <Field id="contact-subject" label="موضوع" error={errors.subject}>
        <input
          id="contact-subject"
          type="text"
          value={form.subject}
          onChange={(event) => update("subject", event.target.value)}
          placeholder="موضوع پیام شما"
          className={cn(inputClassName, errors.subject && "border-red-300")}
        />
      </Field>

      <Field id="contact-message" label="پیام" error={errors.message}>
        <textarea
          id="contact-message"
          rows={6}
          value={form.message}
          onChange={(event) => update("message", event.target.value)}
          placeholder="پیام خود را بنویسید…"
          className={cn(
            inputClassName,
            "resize-y leading-7",
            errors.message && "border-red-300",
          )}
        />
      </Field>

      <button
        type="submit"
        className="inline-flex items-center gap-2 rounded-xl bg-brand-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-brand-700"
      >
        <Send className="h-4 w-4 -scale-x-100" aria-hidden="true" />
        ارسال پیام
      </button>

      <p className="text-xs leading-6 text-ink-400">
        با کلیک روی «ارسال پیام»، برنامهٔ ایمیل شما باز می‌شود و پیام آمادهٔ
        ارسال خواهد بود. هیچ اطلاعاتی روی سرور ما ذخیره نمی‌شود.
      </p>
    </form>
  );
}
