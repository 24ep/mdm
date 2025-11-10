# Use the official Node.js 18 image
FROM node:18-alpine AS base

# Install dependencies only when needed
FROM base AS deps
# Check https://github.com/nodejs/docker-node/tree/b4117f9333da4138b03a546ec926ef50a31506c3#nodealpine to understand why libc6-compat might be needed.
RUN apk add --no-cache libc6-compat
WORKDIR /app

# Install dependencies based on the preferred package manager
COPY package.json package-lock.json* ./
RUN npm ci

# Rebuild the source code only when needed
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Accept build arguments for NEXT_PUBLIC_* variables
# These must be set at build time to be embedded in the client bundle
ARG NEXT_PUBLIC_API_URL=http://localhost:8302
ARG NEXT_PUBLIC_WS_PROXY_URL=ws://localhost:3002/api/openai-realtime
ARG NEXT_PUBLIC_WS_PROXY_PORT=3002

# Set envs for build to avoid SSR failures during prerender
# Note: PostgREST API URL (not Supabase)
ENV NEXT_PUBLIC_API_URL=${NEXT_PUBLIC_API_URL}
ENV NEXT_PUBLIC_WS_PROXY_URL=${NEXT_PUBLIC_WS_PROXY_URL}
ENV NEXT_PUBLIC_WS_PROXY_PORT=${NEXT_PUBLIC_WS_PROXY_PORT}

# Ensure public directory exists (some repos may not include it)
RUN mkdir -p public

# Build the application
RUN npm run build

# Production image, copy all the files and run next
FROM base AS runner
WORKDIR /app

ENV NODE_ENV production
# Uncomment the following line in case you want to disable telemetry during runtime.
# ENV NEXT_TELEMETRY_DISABLED 1
# Note: NEXT_PUBLIC_* variables are set at build time and embedded in the bundle
# Runtime ENV vars here are for reference only (they won't affect client-side code)

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public

# Set the correct permission for prerender cache
RUN mkdir .next
RUN chown nextjs:nodejs .next

# Automatically leverage output traces to reduce image size
# https://nextjs.org/docs/advanced-features/output-file-tracing
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000

ENV PORT 3000
# set hostname to localhost
ENV HOSTNAME "0.0.0.0"

# server.js is created by next build from the standalone output
# https://nextjs.org/docs/pages/api-reference/next-config-js/output
CMD ["node", "server.js"]
