import type { Metadata } from "next";

import AuthPanel from "@/components/auth/AuthPanel";

export const metadata: Metadata = {
  title: "ورود و ساخت پروفایل",
  description:
    "پروفایل محلی بسازید تا ابزارهای اخیر و ذخیره‌شده‌ی خودتان را جدا از بقیه داشته باشید. رمز با PBKDF2 هش می‌شود و چیزی به سرور فرستاده نمی‌شود.",
  alternates: { canonical: "/login" },
  robots: { index: true, follow: true },
};

export default function LoginPage() {
  return <AuthPanel initialMode="sign-up" />;
}
