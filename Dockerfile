# ==========================================================
# Estágio Base: Instalação do pnpm compartilhada
# ==========================================================
FROM node:20-alpine AS base
WORKDIR /app
RUN npm install -g pnpm@9

# ==========================================================
# Estágio 1: Instalação de Dependências de Desenvolvimento
# ==========================================================
FROM base AS dev-deps
COPY package.json pnpm-lock.yaml ./
COPY nest-cli.json tsconfig.json tsconfig.build.json prisma.config.ts ./
RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm install --frozen-lockfile

# ==========================================================
# Estágio 2: Geração dos Clientes Prisma (Shared)
# ==========================================================
FROM dev-deps AS prisma-gen
# URLs Dummy seguras para evitar erro de parsing do schema durante o build
ENV CORE_DB_URL=postgresql://dummy:dummy@localhost:5432/dummy
ENV ORDERS_DB_URL=postgresql://dummy:dummy@localhost:5432/dummy
COPY libs ./libs
RUN pnpm prisma:core:gen && pnpm prisma:orders:gen

# ==========================================================
# Estágio 3: Dependências de Produção (Shared)
# ==========================================================
FROM base AS prod-deps
COPY package.json pnpm-lock.yaml ./
RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm install --prod --frozen-lockfile

# ==========================================================
# Estágio 4: Base para Execução (Runner Base)
# ==========================================================
FROM node:20-alpine AS runner-base
WORKDIR /app
RUN apk add --no-cache curl && \
    addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001
COPY --from=prod-deps /app/node_modules ./node_modules
COPY --from=prod-deps /app/package.json ./package.json
USER nodejs

# ==========================================================
# Estágios de Build Específicos de Cada Serviço
# ==========================================================

# --- REALTIME ---
FROM prisma-gen AS builder-realtime
COPY apps/realtime ./apps/realtime
RUN pnpm exec nest build realtime

FROM runner-base AS realtime
COPY --from=builder-realtime /app/dist ./dist
COPY --from=builder-realtime /app/libs/database/prisma/core/generated ./libs/database/prisma/core/generated
COPY --from=builder-realtime /app/libs/database/prisma/orders/generated ./libs/database/prisma/orders/generated
EXPOSE 4005
CMD ["node", "dist/apps/realtime/main"]

# --- WEBHOOKS ---
FROM prisma-gen AS builder-webhooks
COPY apps/webhooks ./apps/webhooks
RUN pnpm exec nest build webhooks

FROM runner-base AS webhooks
COPY --from=builder-webhooks /app/dist ./dist
COPY --from=builder-webhooks /app/libs/database/prisma/core/generated ./libs/database/prisma/core/generated
COPY --from=builder-webhooks /app/libs/database/prisma/orders/generated ./libs/database/prisma/orders/generated
EXPOSE 4003
CMD ["node", "dist/apps/webhooks/main"]

# --- DASHBOARD ---
FROM prisma-gen AS builder-dashboard
COPY apps/dashboard ./apps/dashboard
RUN pnpm exec nest build dashboard

FROM runner-base AS dashboard
COPY --from=builder-dashboard /app/dist ./dist
COPY --from=builder-dashboard /app/libs/database/prisma/core/generated ./libs/database/prisma/core/generated
COPY --from=builder-dashboard /app/libs/database/prisma/orders/generated ./libs/database/prisma/orders/generated
EXPOSE 4000
CMD ["node", "dist/apps/dashboard/main"]

# --- LANDING ---
FROM prisma-gen AS builder-landing
COPY apps/landing ./apps/landing
RUN pnpm exec nest build landing

FROM runner-base AS landing
COPY --from=builder-landing /app/dist ./dist
COPY --from=builder-landing /app/libs/database/prisma/core/generated ./libs/database/prisma/core/generated
COPY --from=builder-landing /app/libs/database/prisma/orders/generated ./libs/database/prisma/orders/generated
EXPOSE 4006
CMD ["node", "dist/apps/landing/main"]

# --- WORKERS ---
FROM prisma-gen AS builder-workers
COPY apps/workers ./apps/workers
RUN pnpm exec nest build workers

FROM runner-base AS workers
COPY --from=builder-workers /app/dist ./dist
COPY --from=builder-workers /app/libs/database/prisma/core/generated ./libs/database/prisma/core/generated
COPY --from=builder-workers /app/libs/database/prisma/orders/generated ./libs/database/prisma/orders/generated
COPY --from=builder-workers /app/apps/workers/src/modules/mail/templates ./apps/workers/src/modules/mail/templates
CMD ["node", "dist/apps/workers/main"]

# --- CATALOG ---
FROM prisma-gen AS builder-catalog
COPY apps/catalog ./apps/catalog
RUN pnpm exec nest build catalog

FROM runner-base AS catalog
COPY --from=builder-catalog /app/dist ./dist
COPY --from=builder-catalog /app/libs/database/prisma/core/generated ./libs/database/prisma/core/generated
COPY --from=builder-catalog /app/libs/database/prisma/orders/generated ./libs/database/prisma/orders/generated
EXPOSE 4000
CMD ["node", "dist/apps/catalog/main"]
