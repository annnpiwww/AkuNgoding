# Production Dockerfile for AkuNgoding
FROM node:20-alpine AS base

# Install dependencies only when needed
FROM base AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

# Copy package files
COPY package.json package-lock.json ./
# Install ALL dependencies (including devDependencies for build)
RUN npm ci

# Build stage
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Accept build-time environment variables
ARG NEXT_PUBLIC_SUPABASE_URL
ARG NEXT_PUBLIC_SUPABASE_ANON_KEY
ARG LLM_ENCRYPTION_KEY

# Set environment variables for build
ENV NEXT_PUBLIC_SUPABASE_URL=$NEXT_PUBLIC_SUPABASE_URL
ENV NEXT_PUBLIC_SUPABASE_ANON_KEY=$NEXT_PUBLIC_SUPABASE_ANON_KEY
ENV LLM_ENCRYPTION_KEY=$LLM_ENCRYPTION_KEY

# Build Next.js app (without Turbopack to avoid Tailwind v4 issues)
RUN npm run build:production

# Production image
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000

# Create non-root user
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs
# curl untuk healthcheck (alpine ga include curl by default)
RUN apk add --no-cache curl

# Copy built app
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# Create logs directory
RUN mkdir -p /app/logs && chown nextjs:nodejs /app/logs

USER nextjs

EXPOSE 3000

CMD ["node", "server.js"]
