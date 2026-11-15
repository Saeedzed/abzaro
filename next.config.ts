import type { NextConfig } from "next";

/**
 * Security headers.
 *
 * NOTE: `X-Frame-Options` / `frame-ancestors` are intentionally NOT set here so the
 * app can be embedded in preview iframes. If you deploy Abzaro on its own domain
 * and do not need embedding, add:
 *   { key: "X-Frame-Options", value: "SAMEORIGIN" }
 */
const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "X-DNS-Prefetch-Control", value: "on" },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=()",
  },
];

/**
 * `ABZARO_EXPORT=1` produces a fully static export (`out/`) instead of the
 * default server build. This lets the site be hosted anywhere that serves
 * plain files — including a manual drag-and-drop upload to Netlify Drop.
 *
 * The app has no server components that need a request, so a static export is
 * functionally equivalent. The normal build (and Netlify's git integration)
 * uses the Node runtime through @netlify/plugin-nextjs.
 */
const isStaticExport = process.env.ABZARO_EXPORT === "1";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  /**
   * `standalone` emits a self-contained server bundle (`.next/standalone`) that
   * is all the Docker image needs. It is inactive for the plain `next start`
   * and for the static export, so nothing else changes.
   */
  output: isStaticExport ? "export" : undefined,
  ...(process.env.ABZARO_STANDALONE === "1" && !isStaticExport
    ? { output: "standalone" as const }
    : {}),
  poweredByHeader: false,
  ...(isStaticExport
    ? {
        // Emit `path/index.html` instead of `path.html` so static hosting
        // (Netlify Drop, S3, nginx) resolves clean URLs without rewrites.
        trailingSlash: true,
      }
    : {}),
  /**
   * Allow the sandbox preview host(s) to load dev resources (HMR, /_next/* JS
   * chunks). Without this, Next.js blocks cross-origin dev assets from the
   * preview domain and client components (all the tool UIs) never hydrate.
   */
  allowedDevOrigins: ["**.e2b.app", "**.e2b.dev", "**.arena.ai"],
  images: {
    formats: ["image/avif", "image/webp"],
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: securityHeaders,
      },
    ];
  },
};

export default nextConfig;
