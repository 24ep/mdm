FROM node:20-alpine AS base
RUN apk add --no-cache libc6-compat
WORKDIR /app

# Install dependencies
FROM base AS deps
COPY package.json package-lock.json* ./
COPY prisma ./prisma
RUN --mount=type=cache,target=/root/.npm \
    --mount=type=cache,target=/app/node_modules/.cache \
    if [ -f package-lock.json ]; then \
      sed -i.bak '/@next\/swc-win32/d' package-lock.json 2>/dev/null || true; \
    fi && \
    npm config set maxsockets 1 && \
    (npm ci --prefer-offline --no-audit --legacy-peer-deps 2>/dev/null || \
     npm install --no-audit --legacy-peer-deps)

# Build application
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY package.json package-lock.json* ./
COPY next.config.js tsconfig.json tailwind.config.ts postcss.config.js ./
COPY public ./public
COPY src ./src
COPY prisma ./prisma
COPY scripts ./scripts
COPY sql ./sql

ARG NEXT_PUBLIC_API_URL=http://localhost:8302
ARG NEXT_PUBLIC_WS_PROXY_URL=ws://localhost:3002/api/openai-realtime
ARG NEXT_PUBLIC_WS_PROXY_PORT=3002
ARG BUILD_MEMORY_LIMIT=2048

ENV NEXT_PUBLIC_API_URL=${NEXT_PUBLIC_API_URL}
ENV NEXT_PUBLIC_WS_PROXY_URL=${NEXT_PUBLIC_WS_PROXY_URL}
ENV NEXT_PUBLIC_WS_PROXY_PORT=${NEXT_PUBLIC_WS_PROXY_PORT}
ENV NODE_ENV=production
ENV DOCKER_BUILD=true
ENV NEXT_TELEMETRY_DISABLED=1

RUN --mount=type=cache,target=/app/.next/cache \
    --mount=type=cache,target=/app/node_modules/.cache \
    NODE_OPTIONS="--max-old-space-size=${BUILD_MEMORY_LIMIT}" npm run build

# Production image
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=8301
ENV HOSTNAME="0.0.0.0"
ENV NODE_OPTIONS="--max-old-space-size=2048"

RUN apk add --no-cache postgresql-client && \
    addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder --chown=nextjs:nodejs /app/scripts ./scripts
COPY --from=builder --chown=nextjs:nodejs /app/prisma ./prisma
COPY --from=builder --chown=nextjs:nodejs /app/sql ./sql
COPY --from=builder --chown=nextjs:nodejs /app/package.json ./package.json
COPY --from=builder --chown=nextjs:nodejs /app/node_modules ./node_modules
COPY docker-entrypoint.sh /docker-entrypoint.sh

RUN mkdir .next && chown nextjs:nodejs .next && chmod +x /docker-entrypoint.sh

USER nextjs
EXPOSE 8301

ENTRYPOINT ["/docker-entrypoint.sh"]
CMD ["node", "server.js"]
