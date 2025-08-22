# ---------------- Base ----------------
FROM node:20-alpine AS base
ENV PNPM_HOME=/root/.local/share/pnpm
ENV PATH=$PNPM_HOME:$PATH
RUN corepack enable && apk add --no-cache openssl libc6-compat
WORKDIR /app

# ---------------- Builder ----------------
FROM base AS builder
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

# Prisma generate (no DB connection required)
COPY prisma ./prisma
RUN pnpm db:generate

# App source
COPY tsconfig*.json ./
COPY src ./src
COPY views ./views
COPY public ./public

# Build Nest
RUN pnpm build

# ---------------- Production image ----------------
FROM base AS prod
ENV NODE_ENV=production
WORKDIR /app

# Copy node_modules (prod) and built app
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/views ./views
COPY --from=builder /app/public ./public
COPY prisma ./prisma

# tiny entrypoint to run migrations then start
COPY docker/entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

EXPOSE 3000
CMD ["/entrypoint.sh"]