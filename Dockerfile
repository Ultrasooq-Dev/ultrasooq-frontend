# ── Builder stage ──────────────────────────────────────────────
FROM node:22-alpine AS builder

WORKDIR /app

# System deps for native modules (sharp, etc.)
RUN apk add --no-cache libc6-compat

# Copy package files
COPY package.json pnpm-lock.yaml* package-lock.json* yarn.lock* ./

# Install dependencies (--legacy-peer-deps needed for React 19 compatibility)
RUN npm install --legacy-peer-deps

# Copy source code
COPY . .

# Cache bust to ensure env vars are fresh
ARG CACHEBUST=1

# Set build-time env vars (Railway injects these)
ARG NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL

# Build the Next.js app
RUN npm run build

# ── Runner stage ──────────────────────────────────────────────
FROM node:22-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production

# Create non-root user
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

# Copy built assets from builder
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

CMD ["node", "server.js"]
