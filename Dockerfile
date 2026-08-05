# minisite — Next.js 16 (output: 'standalone')
# ---------------------------------------------------------------------
# 1) deps — 의존성만 (레이어 캐시)
# ---------------------------------------------------------------------
FROM node:20-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

# ---------------------------------------------------------------------
# 2) builder — next build (standalone)
# ---------------------------------------------------------------------
FROM node:20-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# 빌드 시점에 번들에 baked-in 되는 NEXT_PUBLIC_* 값
ARG NEXT_PUBLIC_ASSET_BASE
ARG NEXT_PUBLIC_BACK_API
ENV NEXT_PUBLIC_ASSET_BASE=$NEXT_PUBLIC_ASSET_BASE
ENV NEXT_PUBLIC_BACK_API=$NEXT_PUBLIC_BACK_API

ENV NEXT_TELEMETRY_DISABLED=1
RUN npm run build

# ---------------------------------------------------------------------
# 3) runner — standalone 산출물만 가져와서 실행
# ---------------------------------------------------------------------
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=5030
ENV HOSTNAME=0.0.0.0

RUN addgroup -g 1001 -S nodejs && adduser -S nextjs -u 1001

COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder --chown=nextjs:nodejs /app/public ./public

USER nextjs
EXPOSE 5030
CMD ["node", "server.js"]
