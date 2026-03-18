# Weats Backend - Docker Compose Deployment Guide

## 📋 Visão Geral

Este setup utiliza Docker Compose para deploy de uma arquitetura de microserviços com:

- ✅ **3x Gateway API** (Load balanced com Nginx)
- ✅ **Webhooks Processor** (Stripe + Clerk, Bull Queue)
- ✅ **PostgreSQL** (2 databases: core + orders)
- ✅ **Redis** (Caching + Bull Queues)
- ✅ **Nginx** (Load balancer + Reverse proxy)
- ✅ **Health Checks** entre todos os serviços
- ✅ **Auto-restart** se algum container cair

---

## 🚀 Quick Start (Local Testing)

### 1. Preparar Ambiente

```bash
# Clone o repositório
cd weats/backend

# Copiar .env.example para .env
cp .env.example .env

# Editar .env com teus valores (vai abaixo para detalhes)
nano .env
```

### 2. Build & Start

```bash
# Build todos os containers (primeira vez)
docker-compose build

# Iniciar todos os serviços
docker-compose up -d

# Verificar status
docker-compose ps

# Ver logs em tempo real
docker-compose logs -f

# Ver logs de um serviço específico
docker-compose logs -f gateway1
docker-compose logs -f webhooks
docker-compose logs -f nginx
```

### 3. Verificar Health

```bash
# Verificar se todos os serviços estão saudáveis
docker-compose ps

# Testar API através do nginx load balancer
curl http://localhost/health
curl http://localhost/v1/users

# Acessar Bull Board (monitoramento de filas)
open http://localhost/admin/queues

# Verificar Nginx status
curl http://127.0.0.1:8080/nginx-status  # localhost apenas
```

### 4. Parar Serviços

```bash
# Stop apenas (containers e volumes mantêm-se)
docker-compose stop

# Stop e remove containers (data persiste em volumes)
docker-compose down

# Stop e remove TUDO (incluindo volumes!)
docker-compose down -v
```

---

## 📋 Configuração do .env

### Dados Críticos (Mudar obrigatoriamente!)

```bash
# 1. DATABASE PASSWORDS
CORE_DB_PASSWORD=seu_password_seguro_123
ORDERS_DB_PASSWORD=seu_outro_password_456
REDIS_PASSWORD=seu_redis_password_789

# 2. API KEYS (Copiar de dashboards)
CLERK_SECRET_KEY=sk_test_xxxxx
CLERK_WEBHOOK_SECRET=whsec_xxxxx
STRIPE_API_KEY=sk_test_xxxxx
STRIPE_WEBHOOK_SECRET=whsec_xxxxx

# 3. ENCRYPTION (Gerar novos valores!)
ENCRYPTION_KEY=$(openssl rand -hex 32)
ENCRYPTION_SALT=$(openssl rand -hex 16)
ENCRYPTION_IV=$(openssl rand -hex 16)

# 4. CLOUDFLARE
CLOUDFLARE_IMAGES_ACCOUNT_ID=sua_account_id
CLOUDFLARE_CDN_URL=https://imagedelivery.net/hash/

# 5. APP URL
APP_URL=https://seu-dominio.com
```

---

## 🏗️ Arquitetura do Docker Compose

```
┌──────────────────────────────────────────────────────────────┐
│                    NGINX (Port 80/443)                       │
│              Load Balancer + Reverse Proxy                   │
└──────────────────┬───────────────────────────────────────────┘
                   │
        ┌──────────┼──────────┐
        ↓          ↓          ↓
    ┌────────┐ ┌────────┐ ┌────────┐
    │Gateway │ │Gateway │ │Gateway │
    │   1    │ │   2    │ │   3    │
    │:4000   │ │:4000   │ │:4000   │
    └────────┘ └────────┘ └────────┘
        ↓          ↓          ↓
    ┌──────────────────────────────┐
    │    Shared Network Bridge     │
    └──────────────────────────────┘
        ↓          ↓          ↓
    ┌────────┐ ┌────────┐ ┌────────┐
    │Postgres│ │Postgres│ │ Redis  │
    │ core   │ │ orders │ │        │
    └────────┘ └────────┘ └────────┘
        ↑                      ↑
        └──────────┬───────────┘
                   │
            ┌──────────────┐
            │  Webhooks    │
            │  Processor   │
            │  (Bull)      │
            └──────────────┘
```

### Serviços:

| Serviço | Container | Porta (Interna) | Endpoint |
|---------|-----------|-----------------|----------|
| Nginx LB | nginx | 80, 443 | http://localhost |
| Gateway 1 | gateway1 | 4000 | N/A (internal) |
| Gateway 2 | gateway2 | 4000 | N/A (internal) |
| Gateway 3 | gateway3 | 4000 | N/A (internal) |
| Webhooks | webhooks | 3003 | N/A (internal) |
| PostgreSQL Core | postgres-core | 5432 | localhost:5432 |
| PostgreSQL Orders | postgres-orders | 5432 | localhost:5433 |
| Redis | redis | 6379 | localhost:6379 |

---

## 🔍 Health Checks

Cada serviço tem health checks configurados:

```yaml
# Exemplo do Gateway
healthcheck:
  test: ["CMD", "curl", "-f", "http://localhost:4000"]
  interval: 15s        # Verifica a cada 15 segundos
  timeout: 5s          # Timeout de 5 segundos
  start-period: 10s    # Aguarda 10s antes de começar
  retries: 3           # 3 falhas = container unhealthy
```

**Ver status dos health checks:**

```bash
docker-compose ps  # Coluna "STATUS" mostra (healthy) ou (unhealthy)
```

---

## 📊 Networking

Todos os containers usam uma rede compartilhada (`weats-network`):

- **Gateway** pode aceder a **Redis** em `redis:6379` (hostname interno)
- **PostgreSQL** acessível em `postgres-core:5432` e `postgres-orders:5432`
- **Webhooks** pode processar jobs do Redis

**Do exterior (host machine):**
- Nginx: `localhost:80` e `localhost:443`
- PostgreSQL core: `localhost:5432`
- PostgreSQL orders: `localhost:5433`
- Redis: `localhost:6379`

---

## 🔧 Volumes (Data Persistence)

Os volumes são criados automaticamente:

```bash
# Ver volumes
docker volume ls | grep weats

# Inspecionar volume
docker volume inspect weats_backend_postgres_core_data
```

**Volumes:**
- `postgres_core_data` - Database core
- `postgres_orders_data` - Database orders
- `redis_data` - Redis persistence

---

## 🚀 Deploy na VPS (Dokploy)

### 1. Preparação da VPS

```bash
# SSH into your VPS
ssh user@your-vps-ip

# Install Docker & Docker Compose
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Adicionar user ao grupo docker (opcional, para não usar sudo)
sudo usermod -aG docker $USER
newgrp docker
```

### 2. Upload do Projeto

```bash
# Opção A: Git clone
git clone https://seu-repo/weats-backend.git
cd weats-backend

# Opção B: SCP (copy files)
scp -r ./* user@your-vps-ip:/home/user/weats-backend/
```

### 3. Configurar Environment

```bash
# SSH na VPS
ssh user@your-vps-ip

# Criar .env com valores de produção
cd weats-backend
nano .env

# Adicionar valores:
APP_URL=https://seu-dominio.com
NODE_ENV=production
CLERK_SECRET_KEY=sk_prod_xxxxx
STRIPE_API_KEY=sk_live_xxxxx
# ... mais configs
```

### 4. SSL/TLS (HTTPS)

**Opção A: Let's Encrypt com Certbot**

```bash
# Instalar Certbot
sudo apt-get install certbot python3-certbot-nginx -y

# Gerar certificado
sudo certbot certonly --standalone -d seu-dominio.com

# Copiar para o projeto
mkdir -p certs
sudo cp /etc/letsencrypt/live/seu-dominio.com/fullchain.pem certs/cert.pem
sudo cp /etc/letsencrypt/live/seu-dominio.com/privkey.pem certs/key.pem
sudo chown $USER:$USER certs/*
```

**Opção B: Cloudflare SSL (Recomendado)**
- Cloudflare proxies traffic automaticamente com SSL

### 5. Iniciar Containers

```bash
# Build images
docker-compose build

# Iniciar em background
docker-compose up -d

# Verificar
docker-compose ps
docker-compose logs -f nginx

# Testar
curl https://seu-dominio.com/health
```

### 6. Auto-restart & Logging

```bash
# Logs permanentes (JSON-file driver já configurado)
docker-compose logs -f webhooks

# Sistema de monitoração (opcional)
docker stats
```

---

## 🔐 Segurança

### Best Practices Implementadas

✅ **Non-root user** (nodejs user em containers)
✅ **Health checks** para auto-restart
✅ **Rate limiting** no Nginx (100 req/s geral, 200 webhooks)
✅ **Security headers** (HSTS, X-Frame-Options, etc)
✅ **HTTPS/TLS** com certificados
✅ **Gzip compression** ativada
✅ **Deny sensitive files** (.env, .git, etc)

### Melhorias Futuras

- [ ] Implementar WAF (Cloudflare ou ModSecurity)
- [ ] Adicionar fail2ban para brute force
- [ ] Backup automático de databases
- [ ] Monitoring com Prometheus + Grafana
- [ ] Alertas com PagerDuty/Alertmanager

---

## 🐛 Troubleshooting

### Containers não iniciam

```bash
# Ver logs detalhados
docker-compose logs gateway1

# Comum: Database não consegue conectar
# Solução: Verificar CORE_DB_URL no .env
```

### Load balancer retorna 502 Bad Gateway

```bash
# Ver status de cada gateway
docker-compose ps gateway1 gateway2 gateway3

# Verificar logs do Nginx
docker-compose logs nginx

# Se gateways estão down, ver logs:
docker-compose logs gateway1
```

### Redis timeout

```bash
# Verificar conexão Redis
docker exec weats-redis redis-cli -a seu_password ping

# Verificar logs
docker-compose logs redis
```

### Webhooks não processam

```bash
# Ver Bull Board
curl http://localhost/admin/queues

# Ver logs do processor
docker-compose logs webhooks

# Verificar Redis connection
docker exec weats-redis redis-cli -a seu_password
> SELECT 3
> KEYS *
```

### Database Migration Errors

```bash
# Executar Prisma migrations dentro do gateway
docker-compose exec gateway1 npx prisma migrate deploy

# Ou durante build (requer Dockerfile update)
```

---

## 📈 Monitoring & Logs

### Verificar Fila de Webhooks

```bash
# Acceder ao Bull Board
open http://localhost/admin/queues

# Ou via CLI
docker exec weats-redis redis-cli -a seu_password
SELECT 3
LLEN bull:webhooks-queue:wait
LLEN bull:webhooks-queue:active
```

### Logs em Tempo Real

```bash
# Todos os serviços
docker-compose logs -f

# Específico
docker-compose logs -f webhooks
docker-compose logs -f gateway1

# Últimas 50 linhas
docker-compose logs --tail 50 nginx
```

---

## 🔄 Updates & Maintenance

### Atualizar Código

```bash
# Pull latest changes
git pull origin main

# Rebuild containers
docker-compose build

# Restart services (sem downtime)
docker-compose up -d

# Ou rolling update (1 de cada vez)
docker-compose up -d gateway1
sleep 5
docker-compose up -d gateway2
sleep 5
docker-compose up -d gateway3
```

### Backup Database

```bash
# Backup manual
docker exec weats-postgres-core pg_dump -U postgres core > backup.sql

# Restaurar
docker exec -i weats-postgres-core psql -U postgres core < backup.sql
```

### Limpar Espaço

```bash
# Remove unused images/volumes
docker system prune -a

# Apenas volumes não utilizados
docker volume prune
```

---

## 🎯 Próximos Passos

1. **Monitoramento**: Implementar Prometheus + Grafana
2. **Logs Centralizados**: ELK Stack ou Loki
3. **CI/CD**: GitHub Actions para auto-deploy
4. **Backup Automático**: Implementar PostgreSQL backups
5. **Clustering**: Kubernetes para escalar horizontalmente

---

## 📞 Suporte

Para issues, consulta:
- Docker Compose docs: https://docs.docker.com/compose/
- NestJS docs: https://docs.nestjs.com/
- Nginx docs: https://nginx.org/en/docs/
- PostgreSQL docs: https://www.postgresql.org/docs/
- Redis docs: https://redis.io/documentation
