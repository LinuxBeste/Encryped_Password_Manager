FROM node:22-alpine AS builder

RUN corepack enable && corepack prepare pnpm@10 --activate

WORKDIR /app

COPY package.json pnpm-lock.yaml .npmrc ./
RUN pnpm install --frozen-lockfile

COPY tsconfig.json ./
COPY src/ ./src/
RUN pnpm exec tsc

FROM node:22-alpine AS runner

RUN addgroup -S vaultlock && adduser -S vaultlock -G vaultlock

WORKDIR /app

RUN mkdir -p /data && chown -R vaultlock:vaultlock /data

COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY package.json ./

ENV NODE_ENV=production
ENV PORT=3443
ENV DB_PATH=/data/vaultlock.db

EXPOSE 3443

USER vaultlock

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3443/api/health || exit 1

CMD ["node", "dist/index.js"]
