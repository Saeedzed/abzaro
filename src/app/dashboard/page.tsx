import type { Metadata } from "next";

import DashboardView from "@/components/auth/DashboardView";

export const metadata: Metadata = {
  title: "داشبورد",
  description: "ابزارهای اخیر و ذخیره‌شدهٔ شما در یک صفحه.",
  alternates: { canonical: "/dashboard" },
  robots: { index: false, follow: false },
};

export default function DashboardPage() {
  return <DashboardView />;
}
