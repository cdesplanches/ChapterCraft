# Stage 1: Build stage
FROM node:22-bullseye AS builder
WORKDIR /app

ARG CLOUDFLARE_ACCOUNT_ID
ARG CLOUDFLARE_DATABASE_ID
ARG CLOUDFLARE_API_TOKEN
ENV CLOUDFLARE_ACCOUNT_ID=$CLOUDFLARE_ACCOUNT_ID
ENV CLOUDFLARE_DATABASE_ID=$CLOUDFLARE_DATABASE_ID
ENV CLOUDFLARE_API_TOKEN=$CLOUDFLARE_API_TOKEN
ENV NODE_ENV=production

# Install dependencies first (for better build caching)
COPY package*.json ./
RUN npm ci

# Copy the rest of the application source code
COPY . .

# Enable standalone output mode during Next.js build
ENV NEXT_STANDALONE=1
RUN npm run build

# Stage 2: Runner stage
FROM node:22-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"
ENV NEXT_TELEMETRY_DISABLED=1

# Create non-root system user for safety
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

# Copy built outputs and static assets
COPY --from=builder /app/public ./public

# Automatically leverage output traces to reduce image size
# https://nextjs.org/docs/advanced-features/output-file-tracing
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# Ensure data directory exists and has correct permissions
RUN mkdir -p /app/data && chown -R nextjs:nodejs /app/data

USER nextjs

EXPOSE 3000

# Volume for data persistence (when using local storage fallback)
VOLUME /app/data

CMD ["node", "server.js"]
