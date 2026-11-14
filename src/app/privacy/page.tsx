import type { Metadata } from "next";
import { Container } from "@/components/layout/Container";
import { Breadcrumbs } from "@/components/seo/Breadcrumbs";
import { siteConfig } from "@/config/site";

export const metadata: Metadata = {
  title: "حریم خصوصی",
  description: `سیاست حفظ حریم خصوصی ${siteConfig.name}؛ چه اطلاعاتی جمع‌آوری می‌شود و چه اطلاعاتی هرگز از دستگاه شما خارج نمی‌شود.`,
  alternates: { canonical: "/privacy" },
};

const SECTIONS = [
  {
    title: "پردازش در مرورگر شما",
    body: "همهٔ ابزارهای ابزارو — از شمارش کلمات تا تبدیل اعداد — پردازش را در مرورگر شما انجام می‌دهند. متن، عدد یا فایلی که وارد می‌کنید هرگز به سرور ارسال نمی‌شود، ذخیره نمی‌شود و با هیچ شخص ثالثی به اشتراک گذاشته نمی‌شود.",
  },
  {
    title: "چه اطلاعاتی جمع‌آوری می‌کنیم؟",
    body: "ما هیچ حساب کاربری نداریم و از شما اطلاعات شخصی درخواست نمی‌کنیم. محتوای ابزارها (متن‌ها، اعداد و تصاویر) روی سرورهای ما ذخیره نمی‌شود.",
  },
  {
    title: "کوکی‌ها",
    body: "ابزارو فقط از کوکی‌های ضروری برای عملکرد صحیح سایت استفاده می‌کند. هیچ کوکی تبلیغاتی یا ردیابی در سایت قرار نمی‌گیرد.",
  },
  {
    title: "تماس با ما",
    body: `اگر دربارهٔ حریم خصوصی سؤالی دارید، می‌توانید به ایمیل ${siteConfig.email} پیام دهید. فرم تماس نیز فقط برنامهٔ ایمیل شما را باز می‌کند و هیچ داده‌ای را به سرور ارسال نمی‌کند.`,
  },
] as const;

export default function PrivacyPage() {
  return (
    <Container className="py-8 sm:py-12">
      <Breadcrumbs
        items={[{ label: "خانه", href: "/" }, { label: "حریم خصوصی" }]}
      />

      <div className="mx-auto mt-8 max-w-3xl">
        <h1 className="text-3xl font-extrabold text-ink-900 sm:text-4xl">
          سیاست حفظ حریم خصوصی
        </h1>
        <p className="mt-3 text-sm leading-7 text-ink-600 sm:text-base">
          حریم خصوصی شما برای ما مهم است. این صفحه توضیح می‌دهد که در ابزارو
          چه اطلاعاتی پردازش می‌شود و چه اطلاعاتی هرگز از دستگاه شما خارج
          نمی‌شود.
        </p>

        <div className="mt-8 space-y-8">
          {SECTIONS.map((section) => (
            <section key={section.title}>
              <h2 className="text-lg font-bold text-ink-900">{section.title}</h2>
              <p className="mt-2 text-sm leading-8 text-ink-600 sm:text-base">
                {section.body}
              </p>
            </section>
          ))}
        </div>
      </div>
    </Container>
  );
}
