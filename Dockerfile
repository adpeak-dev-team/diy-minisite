# diy-minisite (Next.js 16, output: 'standalone')
# ---------------------------------------------------------------------
# 1) deps : 의존성만 설치 (캐시 레이어)
# ---------------------------------------------------------------------
FROM node:20-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

# ---------------------------------------------------------------------
# 2) builder : next build (standalone 산출물 생성)
# ---------------------------------------------------------------------
FROM node:20-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# 빌드 타임에 baked-in 되는 NEXT_PUBLIC_* 값
ARG NEXT_PUBLIC_ASSET_BASE
ENV NEXT_PUBLIC_ASSET_BASE=$NEXT_PUBLIC_ASSET_BASE

ENV NEXT_TELEMETRY_DISABLED=1
RUN npm run build

# ---------------------------------------------------------------------
# 3) runner : standalone 산출물만 가져와서 실행
# ---------------------------------------------------------------------
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3030
ENV HOSTNAME=0.0.0.0

# non-root 유저로 실행
RUN addgroup -g 1001 -S nodejs && adduser -S nextjs -u 1001

COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder --chown=nextjs:nodejs /app/public ./public

USER nextjs

EXPOSE 3030
CMD ["node", "server.js"]
