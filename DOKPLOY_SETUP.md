# Weats Backend - Dokploy Deployment Guide

## 🚀 Setup Simples no Dokploy

### 1️⃣ Criar Serviços de Infraestrutura

No Dokploy Dashboard, criar:

```
Services:
├── PostgreSQL (Core)
│   └── Database name: core
│
├── PostgreSQL (Orders)
│   └── Database name: orders-db
│
└── Redis
    └── Default config
```

Depois de criar, copiar as URLs de conexão:
```
CORE_DB_URL=postgresql://user:pass@host:5432/core
ORDERS_DB_URL=postgresql://user:pass@host:5432/orders-db
REDIS_HOST=redis-host
REDIS_PORT=6379
REDIS_PASSWORD=password
```

---

### 2️⃣ Deploy via Git + Docker Compose

No Dokploy:

```
1. Projects → New Project → Git Import
2. Repository: https://github.com/seu-repo/weats-backend
3. Branch: main
4. Docker Compose Deploy
5. Selecionar docker-compose.yml do root
```

---

### 3️⃣ Configurar Environment Variables

No Dokploy, para cada app (Gateway, Webhooks, Dashboard):

**Environment → Add Variable:**

```
NODE_ENV: production
APP_URL: https://seu-dominio.com

# PostgreSQL URLs (do passo 1)
CORE_DB_URL: postgresql://user:pass@host:5432/core
ORDERS_DB_URL: postgresql://user:pass@host:5432/orders-db

# Redis (do passo 1)
REDIS_HOST: redis-host
REDIS_PORT: 6379
REDIS_USERNAME: default
REDIS_PASSWORD: password
REDIS_EMAIL_DB: 1
REDIS_IMAGES_DB: 2
REDIS_WEBHOOK_DB: 3
REDIS_CACHE_DB: 4
REDIS_QRCODES_DB: 5
REDIS_SESSION_DB: 6

# Third-party APIs
CLERK_SECRET_KEY: sk_prod_xxxxx
CLERK_WEBHOOK_SECRET: whsec_xxxxx
STRIPE_API_KEY: sk_live_xxxxx
STRIPE_WEBHOOK_SECRET: whsec_xxxxx

# Cloudflare
CLOUDFLARE_IMAGES_ACCOUNT_ID: xxxxx
CLOUDFLARE_CDN_URL: https://imagedelivery.net/xxxxx/

# Encryption (gerar: openssl rand -hex 32)
ENCRYPTION_ALGORITHM: aes-256-ctr
ENCRYPTION_KEY: xxxxx
ENCRYPTION_SALT: xxxxx
ENCRYPTION_IV: xxxxx

# Discord (optional)
DISCORD_WEBHOOK_URL: https://discordapp.com/api/webhooks/xxxxx

# Eupago (optional)
EUPAGO_API_URL: https://sandbox.eupago.pt/api/v1.02/
```

**IMPORTANTE: Configurar estas vars no Dokploy, não no docker-compose.yml!**

---

### 4️⃣ Deploy os 3 Apps

Dokploy vai fazer build de cada serviço do docker-compose:

```
✅ Gateway:4000
✅ Webhooks (internal)
✅ Dashboard (internal)
```

---

### 5️⃣ Configurar Load Balancer (Nginx/Caddy)

Dokploy cria automaticamente um load balancer:

```
Domain: seu-dominio.com → Load Balancer → Gateway:4000

SSL: Let's Encrypt (automático)
```

---

### 6️⃣ Testar Deploy

```bash
# Via Dokploy Dashboard:
1. Ir para Project → Gateway
2. Ver logs em tempo real
3. Verificar Health: verde ✅

# Via terminal:
curl https://seu-dominio.com/health
curl https://seu-dominio.com/v1/users

# Monitorar filas:
open https://seu-dominio.com/admin/queues
```

---

## 📋 Checklist de Deploy

- [ ] PostgreSQL Core criado em Dokploy
- [ ] PostgreSQL Orders criado em Dokploy
- [ ] Redis criado em Dokploy
- [ ] URLs de conexão copiadas
- [ ] Repo Git importado no Dokploy
- [ ] docker-compose.yml está no root do projeto
- [ ] Variáveis de ambiente configuradas no Dokploy (não no compose!)
- [ ] Deployment iniciado
- [ ] Apps saudáveis (health check ✅)
- [ ] Domínio apontando para Load Balancer
- [ ] SSL/TLS funcionando
- [ ] API endpoints respondendo
- [ ] Webhooks recebendo (Bull Board acessível)

---

## ⚠️ Importante: Env Vars no Dokploy, Não no Compose

**❌ NÃO fazer:**
```yaml
# Não hardcode secrets no docker-compose.yml
environment:
  CLERK_SECRET_KEY: sk_prod_xxxxx  # ❌ PERIGO
  STRIPE_API_KEY: sk_live_xxxxx    # ❌ PERIGO
```

**✅ FAZER:**
```yaml
# docker-compose.yml
environment:
  CLERK_SECRET_KEY: ${CLERK_SECRET_KEY}  # ✅ Referência
  STRIPE_API_KEY: ${STRIPE_API_KEY}      # ✅ Referência
```

Depois configurar os valores no Dokploy Dashboard.

---

## 🔐 Segurança

✅ **Já implementado:**
- Secrets não são commitados
- Variáveis referenciadas com ${VAR}
- HTTPS/SSL automático
- Restart policies
- Health checks

⚠️ **Fazer:**
- [ ] Backup automático de databases
- [ ] Monitoramento de logs
- [ ] Alertas (Slack, email)

---

## 🚨 Troubleshooting

| Problema | Solução |
|----------|---------|
| App não inicia | Ver logs do Dokploy; verificar env vars |
| 502 Bad Gateway | Verificar health check; restartar container |
| Database connection error | Verificar CORE_DB_URL, ORDERS_DB_URL |
| Redis connection error | Verificar REDIS_HOST, REDIS_PASSWORD |
| Webhooks não funcionam | Verificar Bull Board; ver logs do processor |

---

## 📚 Próximos Passos

1. ✅ Deploy na VPS via Dokploy (este guia)
2. ✅ Testar webhooks (Stripe, Clerk)
3. ✅ Monitorar performance
4. ✅ Configurar backups automáticos
5. ✅ Setup monitoring (Prometheus, alertas)

---

**Deploy Done! 🎉**
