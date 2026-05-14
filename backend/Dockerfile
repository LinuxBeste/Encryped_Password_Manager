# Stage 1: Builder
FROM node:20-alpine AS builder

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci --omit=dev

COPY tsconfig.json ./
COPY src/ ./src/
RUN npx tsc

# Stage 2: Runner
FROM node:20-alpine AS runner

RUN addgroup -S vaultlock && adduser -S vaultlock -G vaultlock

WORKDIR /app

RUN mkdir -p /data/db /data/certs && chown -R vaultlock:vaultlock /data

COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY package.json ./

EXPOSE 3443

USER vaultlock

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3443/api/health || exit 1

CMD ["node", "dist/index.js"]
