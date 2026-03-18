# Weats Backend - Dokploy Deployment

## 🚀 Setup

### 1️⃣ Infraestrutura

Criar no Dokploy:
- PostgreSQL Core (db: `core`)
- PostgreSQL Orders (db: `orders-db`)
- Redis

Copiar URLs de conexão.

### 2️⃣ Import Git

```
Projects → New → Git Import
Repository: https://github.com/seu-repo/weats-backend
Branch: main
```

### 3️⃣ Docker Compose Deploy

Selecionar `docker-compose.yml` do root (será feito automaticamente).

### 4️⃣ Environment Variables

Dokploy vai pedir para configurar variáveis. Adicionar todas de `.env.example`:

```
NODE_ENV: production
APP_URL: https://seu-dominio.com

CORE_DB_URL: postgresql://...
ORDERS_DB_URL: postgresql://...
REDIS_HOST: ...
REDIS_PORT: ...
REDIS_USERNAME: ...
REDIS_PASSWORD: ...
REDIS_EMAIL_DB: 1
REDIS_IMAGES_DB: 2
REDIS_WEBHOOK_DB: 3
REDIS_CACHE_DB: 4
REDIS_QRCODES_DB: 5
REDIS_SESSION_DB: 6

CLERK_SECRET_KEY: sk_prod_xxxxx
CLERK_WEBHOOK_SECRET: whsec_xxxxx
STRIPE_API_KEY: sk_live_xxxxx
STRIPE_WEBHOOK_SECRET: whsec_xxxxx

CLOUDFLARE_IMAGES_ACCOUNT_ID: xxxxx
CLOUDFLARE_CDN_URL: https://...

ENCRYPTION_ALGORITHM: aes-256-ctr
ENCRYPTION_KEY: xxxxx
ENCRYPTION_SALT: xxxxx
ENCRYPTION_IV: xxxxx

DISCORD_WEBHOOK_URL: https://...
EUPAGO_API_URL: https://...
```

### 5️⃣ Deploy

Dokploy faz:
- Build dos 3 apps
- Inicia containers
- Health checks
- Load balancer + SSL

### 6️⃣ Testar

```bash
curl https://seu-dominio.com/health
curl https://seu-dominio.com/v1/users
https://seu-dominio.com/admin/queues  # Bull Board
```

---

## ✅ Pronto!
