# ─────────────────────────────────────────────────────────────────────────────
# Dockerfile for Abzaro (Next.js) — the fallback path if Liara's Next platform
# rejects the app. Deploy with:
#     liara deploy --platform=docker --port=3000
#
# Multi-stage: build with dev dependencies, ship only the standalone server.
# ─────────────────────────────────────────────────────────────────────────────
FROM node:22-alpine AS base
RUN apk add --no-cache libc6-compat curl
WORKDIR /app

# ---------- dependencies ----------
FROM base AS deps
COPY package.json package-lock.json* ./
RUN npm ci --no-audit --no-fund

# ---------- build ----------
FROM base AS builder
COPY --from=deps /app/node_modules ./node_modules
COPY . .
# The ffmpeg core files are copied by the prebuild script; a plain build is fine
# because they are already committed under public/.
ENV NEXT_TELEMETRY_DISABLED=1
RUN npm run build

# ---------- runtime ----------
FROM base AS runner
ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    PORT=3000 \
    HOSTNAME=0.0.0.0

RUN addgroup --system --gid 1001 nodejs \
 && adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs
EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=10s --start-period=20s --retries=3 \
  CMD curl --fail http://localhost:3000/ || exit 1

CMD ["node", "server.js"]
