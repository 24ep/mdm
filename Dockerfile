# Use the official Node.js 20 image (required for Next.js 16)
FROM node:20-alpine AS base

# Install dependencies only when needed
FROM base AS deps
# Check https://github.com/nodejs/docker-node/tree/b4117f9333da4138b03a546ec926ef50a31506c3#nodealpine to understand why libc6-compat might be needed.
RUN apk add --no-cache libc6-compat
WORKDIR /app

# Copy package files and prisma schema (needed for postinstall script)
# IMPORTANT: prisma directory must be copied before npm install to allow postinstall script to run
COPY package.json package-lock.json* ./
COPY prisma ./prisma
# Remove Windows-specific packages from lock file and install
# Use BuildKit cache mounts for npm cache and node_modules (faster subsequent builds)
# Use --prefer-offline and --no-audit for faster installs
# Limit npm install to use fewer resources (maxsockets=1, maxconcurrent=1)
RUN --mount=type=cache,target=/root/.npm \
    --mount=type=cache,target=/app/node_modules/.cache \
    if [ -f package-lock.json ]; then \
      sed -i.bak '/@next\/swc-win32/d' package-lock.json 2>/dev/null || true; \
    fi && \
    npm config set maxsockets 1 && \
    npm config set maxconcurrent 1 && \
    (npm ci --prefer-offline --no-audit --legacy-peer-deps 2>/dev/null || \
     npm install --no-audit --legacy-peer-deps)

# Rebuild the source code only when needed
FROM base AS builder
WORKDIR /app

# Copy dependencies from deps stage
COPY --from=deps /app/node_modules ./node_modules

# Copy only necessary files for build (better caching)
# Copy config files first (they change less frequently)
COPY package.json next.config.js tsconfig.json tailwind.config.ts postcss.config.js ./

# Copy source code directories (combine to reduce layers)
COPY public src prisma scripts sql ./

# Accept build arguments for NEXT_PUBLIC_* variables
# These must be set at build time to be embedded in the client bundle
ARG NEXT_PUBLIC_API_URL=http://localhost:8302
ARG NEXT_PUBLIC_WS_PROXY_URL=ws://localhost:3002/api/openai-realtime
ARG NEXT_PUBLIC_WS_PROXY_PORT=3002
# Build memory limit (can be overridden: --build-arg BUILD_MEMORY_LIMIT=1024)
ARG BUILD_MEMORY_LIMIT=2048

# Set envs for build to avoid SSR failures during prerender
# Note: PostgREST API URL (not Supabase)
ENV NEXT_PUBLIC_API_URL=${NEXT_PUBLIC_API_URL}
ENV NEXT_PUBLIC_WS_PROXY_URL=${NEXT_PUBLIC_WS_PROXY_URL}
ENV NEXT_PUBLIC_WS_PROXY_PORT=${NEXT_PUBLIC_WS_PROXY_PORT}
ENV NODE_ENV=production
ENV DOCKER_BUILD=true
ENV NEXT_TELEMETRY_DISABLED=1

# Build the application with optimizations
# Use BuildKit cache mounts for Next.js cache and node_modules (faster subsequent builds)
# Limit build resources: reduce memory usage during build
RUN --mount=type=cache,target=/app/.next/cache \
    --mount=type=cache,target=/app/node_modules/.cache \
    NODE_OPTIONS="--max-old-space-size=${BUILD_MEMORY_LIMIT}" npm run build

# Production image, copy all the files and run next
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
# Note: NEXT_PUBLIC_* variables are set at build time and embedded in the bundle
# Runtime ENV vars here are for reference only (they won't affect client-side code)

# Install PostgreSQL client tools and create user (combine to reduce layers)
RUN apk add --no-cache postgresql-client && \
    addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public

# Set the correct permission for prerender cache (combine to reduce layers)
RUN mkdir .next && chown nextjs:nodejs .next

# Automatically leverage output traces to reduce image size
# https://nextjs.org/docs/advanced-features/output-file-tracing
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# Copy scripts, prisma, sql, package.json, and node_modules for initialization (combine to reduce layers)
COPY --from=builder --chown=nextjs:nodejs /app/scripts ./scripts
COPY --from=builder --chown=nextjs:nodejs /app/prisma ./prisma
COPY --from=builder --chown=nextjs:nodejs /app/sql ./sql
COPY --from=builder --chown=nextjs:nodejs /app/package.json ./package.json
# Copy only production node_modules (pg, bcryptjs, tsx, etc.) needed for scripts
COPY --from=builder --chown=nextjs:nodejs /app/node_modules ./node_modules

# Copy and set up entrypoint script (before switching user)
COPY docker-entrypoint.sh /docker-entrypoint.sh
RUN chmod +x /docker-entrypoint.sh

USER nextjs

EXPOSE 8301

ENV PORT=8301
# set hostname to localhost
ENV HOSTNAME="0.0.0.0"
# Increase Node.js memory limit to prevent heap out of memory errors (reduced from 4096 to 2048 for runtime)
ENV NODE_OPTIONS="--max-old-space-size=2048"

# Use entrypoint to handle initialization before starting the server
ENTRYPOINT ["/docker-entrypoint.sh"]

# server.js is created by next build from the standalone output
# https://nextjs.org/docs/pages/api-reference/next-config-js/output
CMD ["node", "server.js"]
