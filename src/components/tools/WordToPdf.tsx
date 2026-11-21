"use client";

import { useEffect, useRef, useState } from "react";
import { FileText, Printer } from "lucide-react";
import { UploadZone } from "./UploadZone";

const MAX_BYTES = 10 * 1024 * 1024;
type DesktopBridge = { convertDocx: (bytes: Uint8Array, name: string) => Promise<{ canceled: boolean }> };
function desktopBridge(): DesktopBridge | undefined {
  return (window as Window & { abzaroDesktop?: DesktopBridge }).abzaroDesktop;
}
const PRINT_STYLE = `
@page { size: A4; margin: 18mm; }
* { box-sizing: border-box; }
body { color: #111827; font-family: Tahoma, Arial, sans-serif; font-size: 12pt; line-height: 1.8; overflow-wrap: anywhere; }
h1,h2,h3 { line-height: 1.4; break-after: avoid; }
p { margin: 0 0 0.7em; }
table { width: 100%; border-collapse: collapse; margin: 1em 0; }
td,th { border: 1px solid #9ca3af; padding: 6px; vertical-align: top; }
tr,img { break-inside: avoid; } img { max-width: 100%; height: auto; }
`;

export default function WordToPdf() {
  const [html, setHtml] = useState("");
  const [desktopFile, setDesktopFile] = useState<File | null>(null);
  const [desktop, setDesktop] = useState(false);
  const [desktopMessage, setDesktopMessage] = useState("");
  useEffect(() => { setDesktop(!!desktopBridge()); }, []);
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [printing, setPrinting] = useState(false);
  const [direction, setDirection] = useState<"rtl" | "ltr">("rtl");
  const frame = useRef<HTMLIFrameElement | null>(null);
  useEffect(() => () => { frame.current?.remove(); }, []);

  async function choose(files: File[]) {
    const file = files[0];
    if (!file || busy) return;
    if ((html || desktopFile) && !window.confirm("سند فعلی با سند انتخاب‌شده جایگزین شود؟")) return;
    setError(""); setHtml(""); setName(""); setDesktopFile(null); setDesktopMessage("");
    if (!/\.docx$/i.test(file.name)) { setError("فقط فایل DOCX پشتیبانی می‌شود؛ فایل قدیمی DOC را ابتدا به DOCX تبدیل کنید."); return; }
    if (!file.size || file.size > (desktop ? 20 * 1024 * 1024 : MAX_BYTES)) { setError(desktop ? "فایل باید غیرخالی و حداکثر ۲۰ مگابایت باشد." : "فایل باید غیرخالی و حداکثر ۱۰ مگابایت باشد."); return; }
    if (desktop && desktopBridge()) { setDesktopFile(file); setName(file.name); return; }
    setBusy(true);
    try {
      const [{ default: mammoth }, { default: DOMPurify }] = await Promise.all([import("mammoth/mammoth.browser"), import("dompurify")]);
      const converted = await mammoth.convertToHtml({ arrayBuffer: await file.arrayBuffer() }, {
        externalFileAccess: false,
        convertImage: mammoth.images.imgElement(async image => {
          if (!/^image\/(png|jpeg|gif|webp)$/i.test(image.contentType)) return { src: "", alt: "تصویر پشتیبانی‌نشده" };
          const data = await image.read("base64");
          return { src: `data:${image.contentType};base64,${data}` };
        }),
      });
      // Imported markup is untrusted. Strip active content and links, and never
      // allow external images: a user's document must not contact remote hosts.
      const clean = DOMPurify.sanitize(converted.value, {
        ALLOWED_TAGS: ["p", "br", "strong", "em", "s", "u", "h1", "h2", "h3", "h4", "h5", "h6", "ul", "ol", "li", "table", "thead", "tbody", "tr", "td", "th", "img", "sup", "sub", "blockquote"],
        ALLOWED_ATTR: ["src", "alt", "colspan", "rowspan"],
        ALLOW_DATA_ATTR: false,
      });
      const container = document.createElement("div"); container.innerHTML = clean;
      for (const img of container.querySelectorAll("img")) {
        if (!/^data:image\/(png|jpeg|gif|webp);base64,/i.test(img.getAttribute("src") || "")) img.remove();
      }
      if (!container.textContent?.trim() && !container.querySelector("img")) throw new Error("empty");
      setName(file.name); setHtml(container.innerHTML);
    } catch {
      setError("سند خوانده نشد؛ مطمئن شوید فایل DOCX سالم و بدون رمز است. فایل‌های پیچیده یا بسیار بزرگ ممکن است پشتیبانی نشوند.");
    } finally { setBusy(false); }
  }

  async function convertDesktop() {
    if (!desktopFile || busy) return;
    setBusy(true); setError(""); setDesktopMessage("");
    try {
      const bridge = desktopBridge();
      if (!bridge) throw new Error("برنامهٔ تبدیل در دسترس نیست.");
      const result = await bridge.convertDocx(new Uint8Array(await desktopFile.arrayBuffer()), desktopFile.name);
      if (!result.canceled) setDesktopMessage("فایل PDF با موفقیت ذخیره شد.");
    } catch (cause) { setError(cause instanceof Error ? cause.message : "تبدیل انجام نشد."); }
    finally { setBusy(false); }
  }

  async function printPdf() {
    if (!html || printing) return;
    setPrinting(true); setError("");
    try {
      frame.current?.remove();
      const iframe = document.createElement("iframe");
      iframe.setAttribute("title", "پیش‌نمایش چاپ سند");
      iframe.style.cssText = "position:fixed;right:0;bottom:0;width:1px;height:1px;border:0;opacity:0;pointer-events:none";
      document.body.appendChild(iframe); frame.current = iframe;
      const doc = iframe.contentDocument;
      if (!doc || !iframe.contentWindow) throw new Error("print-unavailable");
      doc.open(); doc.write(`<!doctype html><html><head><meta charset="utf-8"><style>${PRINT_STYLE}</style></head><body dir="${direction}">${html}</body></html>`); doc.close();
      doc.title = name.replace(/\.docx$/i, "") || "document";
      await Promise.all(Array.from(doc.images, image => image.decode().catch(() => undefined)));
      iframe.contentWindow.focus(); iframe.contentWindow.print();
    } catch { setError("پنجرهٔ چاپ باز نشد. قابلیت چاپ مرورگر و مجوزهای دستگاه را بررسی کنید."); }
    finally { setPrinting(false); }
  }

  return <div className="space-y-4">
    <UploadZone title="فایل Word را انتخاب کنید" hint={desktop ? "فقط DOCX بدون رمز؛ حداکثر ۲۰ مگابایت" : "فقط DOCX بدون رمز؛ حداکثر ۱۰ مگابایت"} buttonLabel="انتخاب فایل DOCX" accept=".docx,application/vnd.openxmlformats-officedocument.wordprocessingml.document" onFiles={files => void choose(files)} sampleSkipConfirmation icon={<FileText className="h-7 w-7" aria-hidden="true" />} disabled={busy || printing} testId="word-to-pdf-input" />
    {busy && <p role="status" className="text-sm text-ink-600">{desktop ? "در حال تبدیل روی کامپیوتر…" : "در حال خواندن سند…"}</p>}
    {error && <p role="alert" data-testid="word-to-pdf-error" className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</p>}
    {desktopFile && <section className="space-y-4 rounded-2xl border border-ink-200 bg-white p-4 sm:p-5" data-testid="desktop-word-result">
      <p className="break-all text-sm font-semibold">{name}</p>
      <p className="text-sm leading-7 text-ink-600">تبدیل با LibreOffice روی همین کامپیوتر انجام می‌شود؛ فایل به سرور ارسال نمی‌شود. پس از انتخاب محل ذخیره منتظر پایان تبدیل بمانید.</p>
      <button type="button" disabled={busy} onClick={() => void convertDesktop()} data-testid="desktop-word-convert" className="min-h-11 w-full rounded-xl bg-brand-600 px-4 py-3 text-sm font-bold text-white disabled:opacity-50">تبدیل و ذخیرهٔ PDF</button>
      {desktopMessage && <p role="status" className="text-sm text-green-700">{desktopMessage}</p>}
    </section>}
    {html && <section className="motion-enter space-y-4 rounded-2xl border border-ink-200 bg-white p-4 sm:p-5" data-testid="word-to-pdf-result">
      <p className="break-all text-sm font-semibold text-ink-900">{name}</p>
      <label className="block text-sm font-semibold">جهت متن
        <select value={direction} onChange={event => setDirection(event.target.value as "rtl" | "ltr")} className="mt-2 min-h-11 w-full rounded-lg border border-ink-200 bg-white px-3" data-testid="word-to-pdf-direction"><option value="rtl">راست‌به‌چپ (فارسی)</option><option value="ltr">چپ‌به‌راست</option></select>
      </label>
      <p className="text-xs leading-6 text-ink-600">برای ساخت PDF، دکمه را بزنید و در پنجرهٔ چاپ مرورگر گزینهٔ «Save as PDF / ذخیره به‌صورت PDF» را انتخاب کنید. این دکمه چاپ کاغذی انجام نمی‌دهد مگر خودتان چاپگر را انتخاب کنید.</p>
      <button type="button" onClick={() => void printPdf()} disabled={printing} data-testid="word-to-pdf-print" className="motion-press inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-brand-600 px-4 py-3 text-sm font-bold text-white disabled:opacity-50"><Printer className="h-4 w-4" />{printing ? "در حال آماده‌سازی…" : "چاپ یا ذخیره به‌صورت PDF"}</button>
      <div className="overflow-auto rounded-xl border border-ink-200 bg-white p-4"><p className="mb-4 text-xs font-bold text-ink-500">پیش‌نمایش تقریبی محتوا</p><div dir={direction} className="word-preview" data-testid="word-to-pdf-preview" dangerouslySetInnerHTML={{ __html: html }} /></div>
      <style>{`.word-preview{font-family:Tahoma,Arial,sans-serif;line-height:1.8;overflow-wrap:anywhere}.word-preview p{margin:0 0 .7em}.word-preview h1,.word-preview h2,.word-preview h3{font-weight:bold;line-height:1.4;margin:.7em 0}.word-preview h1{font-size:1.6em}.word-preview h2{font-size:1.3em}.word-preview table{width:100%;border-collapse:collapse;margin:1em 0}.word-preview td,.word-preview th{border:1px solid #9ca3af;padding:6px}.word-preview img{max-width:100%;height:auto}.word-preview ul{list-style:disc;padding-inline-start:2em}.word-preview ol{list-style:decimal;padding-inline-start:2em}`}</style>
    </section>}
  </div>;
}
