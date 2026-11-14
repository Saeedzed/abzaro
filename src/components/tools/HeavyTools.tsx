"use client";

import dynamic from "next/dynamic";

/**
 * The heavy tools (pdf-lib ≈ 400 KB, pdfjs ≈ 1 MB, jszip, qrcode, heic2any)
 * live behind this client-only gate.
 *
 * Why a separate client component: `next/dynamic` declared in a Server
 * Component still emits an async `<script>` preload for every candidate chunk
 * in the HTML, so a text-only tool page was downloading the whole PDF stack.
 * Inside a Client Component the imports stay lazy — a chunk is fetched only
 * when that specific tool actually renders.
 */

function ToolLoading() {
  return (
    <div className="rounded-2xl border border-ink-200 bg-white p-6">
      <div className="flex items-center gap-2 text-xs text-ink-500">
        <span
          className="h-3 w-3 animate-spin rounded-full border-2 border-brand-500 border-t-transparent"
          aria-hidden="true"
        />
        در حال بارگذاری ابزار…
      </div>
    </div>
  );
}

const heavy = {
  "pdf-merger": dynamic(() => import("./PdfMerger").then((mod) => mod.PdfMerger), { loading: ToolLoading }),
  "pdf-compressor": dynamic(() => import("./PdfCompressor").then((mod) => mod.PdfCompressor), { loading: ToolLoading }),
  "pdf-to-image": dynamic(() => import("./PdfToImage").then((mod) => mod.PdfToImage), { loading: ToolLoading }),
  "image-to-pdf": dynamic(() => import("./ImageToPdf").then((mod) => mod.ImageToPdf), { loading: ToolLoading }),
  "qr-code-generator": dynamic(() => import("./QrCodeGenerator").then((mod) => mod.QrCodeGenerator), { loading: ToolLoading }),
  "heic-to-jpg": dynamic(() => import("./HeicToJpg").then((mod) => mod.HeicToJpg), { loading: ToolLoading }),
  "pdf-reorder": dynamic(() => import("./PdfPageReorder").then((mod) => mod.PdfPageReorder), { loading: ToolLoading }),
  "pdf-watermark": dynamic(() => import("./PdfWatermark").then((mod) => mod.PdfWatermark), { loading: ToolLoading }),
  "favicon-generator": dynamic(() => import("./FaviconGenerator").then((mod) => mod.FaviconGenerator), { loading: ToolLoading }),
  "video-compressor": dynamic(() => import("./VideoCompressor").then((mod) => mod.VideoCompressor), { loading: ToolLoading }),
  "video-to-gif": dynamic(() => import("./VideoToGif").then((mod) => mod.VideoToGif), { loading: ToolLoading }),
  "video-to-audio": dynamic(() => import("./VideoToAudio").then((mod) => mod.VideoToAudio), { loading: ToolLoading }),
  "video-trimmer": dynamic(() => import("./VideoTrimmer").then((mod) => mod.VideoTrimmer), { loading: ToolLoading }),
  "video-resizer": dynamic(() => import("./VideoResizer").then((mod) => mod.VideoResizer), { loading: ToolLoading }),
} as const;

type HeavySlug = keyof typeof heavy;

export type PdfPageToolKind = "rotate" | "delete" | "split";

const PdfPageTool = dynamic(() => import("./PdfPageTool").then((mod) => mod.PdfPageTool), {
  loading: ToolLoading,
});

/** Renders one of the heavy tools, downloading its bundle on demand. */
export function HeavyTool({ slug }: { slug: HeavySlug }) {
  const Component = heavy[slug];
  return <Component />;
}

/** The three page-level PDF tools share one implementation. */
export function PdfPageToolLoader({ kind }: { kind: PdfPageToolKind }) {
  return <PdfPageTool kind={kind} />;
}
