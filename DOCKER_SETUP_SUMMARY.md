# Docker Compose Deployment - Setup Summary

## 📋 O Que Foi Criado

### Arquivos de Configuração
```
✅ Dockerfile.gateway       - Build Gateway API (multi-stage)
✅ Dockerfile.webhooks      - Build Webhooks Processor (multi-stage)
✅ docker-compose.yml       - Orquestração de 7 serviços
✅ nginx.conf               - Load balancer (3 replicas)
✅ .dockerignore            - Otimização de build
✅ .env.example             - Template de variáveis
✅ docker.sh                - Helper script bash
✅ DEPLOYMENT.md            - Guia completo (~11K)
✅ DOCKER_QUICKSTART.md     - Quick reference (~7K)
```

---

## 🎯 Arquitetura Final

```
                    INTERNET
                       ↓
         ┌─────────────────────────────┐
         │  Nginx Load Balancer        │
         │  - SSL/TLS Termination      │
         │  - Rate Limiting            │
         │  - Gzip Compression         │
         │  - Security Headers         │
         └─────────────┬───────────────┘
                       ↓
        ┌──────────┬──────────┬──────────┐
        ↓          ↓          ↓          ↓
    ┌─────┐   ┌─────┐   ┌─────┐   ┌─────┐
    │GW-1 │   │GW-2 │   │GW-3 │   │GW-4 │ (Replicas podem ser escaladas)
    └──┬──┘   └──┬──┘   └──┬──┘   └──┬──┘
       └─────────┼─────────┼─────────┘
               ┌─┴─────────┴─┐
               │  Network    │
               │  Bridge     │
               └─┬───────┬───┘
        ┌────────┘       └──────────┐
        ↓                           ↓
    ┌─────────────┐         ┌──────────────┐
    │ PostgreSQL  │         │  Webhooks    │
    │ (2 DBs)     │         │  Processor   │
    │ + Redis     │         │  (Bull)      │
    └─────────────┘         └──────────────┘
```

---

## 🚀 Como Usar

### 1️⃣ Primeira Execução (5 minutos)

```bash
# Preparar
cp .env.example .env
nano .env                    # Adicionar valores reais

# Iniciar
docker-compose up -d

# Verificar
docker-compose ps            # Todos devem ser "Up (healthy)"
curl http://localhost/health # Deve retornar 200
```

### 2️⃣ Operações Comuns

```bash
# Ver status
docker-compose ps

# Ver logs
docker-compose logs -f
docker-compose logs -f gateway1
docker-compose logs -f webhooks

# Restart um serviço
docker-compose restart gateway1

# Parar tudo
docker-compose stop

# Parar e remover containers
docker-compose down

# Rebuild após código change
docker-compose build
docker-compose up -d
```

### 3️⃣ Usar o Helper Script

```bash
chmod +x docker.sh

./docker.sh start              # Inicia tudo
./docker.sh status             # Ver status
./docker.sh logs gateway1      # Ver logs
./docker.sh health             # Health check status
./docker.sh test-api           # Testar API
./docker.sh test-db            # Testar databases
./docker.sh backup-db          # Fazer backup
./docker.sh restart gateway1   # Restart um serviço
./docker.sh down               # Stop (preserve data)
./docker.sh down-volumes       # Stop + delete EVERYTHING
```

---

## 📊 Serviços Inclusos

| Serviço | Container | Porta (Ext) | Saúde | Auto-Restart |
|---------|-----------|-------------|-------|--------------|
| **Nginx** | weats-nginx | 80, 443 | ✅ 10s | ✅ |
| **Gateway-1** | weats-gateway-1 | - | ✅ 15s | ✅ |
| **Gateway-2** | weats-gateway-2 | - | ✅ 15s | ✅ |
| **Gateway-3** | weats-gateway-3 | - | ✅ 15s | ✅ |
| **Webhooks** | weats-webhooks | - | ✅ 15s | ✅ |
| **PostgreSQL Core** | weats-postgres-core | 5432 | ✅ 10s | ✅ |
| **PostgreSQL Orders** | weats-postgres-orders | 5433 | ✅ 10s | ✅ |
| **Redis** | weats-redis | 6379 | ✅ 10s | ✅ |

---

## 🌍 Endpoints

| Endpoint | Descrição |
|----------|-----------|
| `http://localhost/` | Root (health check) |
| `http://localhost/health` | Health endpoint |
| `http://localhost/v1/*` | API endpoints |
| `http://localhost/admin/queues` | Bull Board (filas) |
| `http://127.0.0.1:8080/nginx-status` | Nginx stats |

---

## 🔐 Segurança

✅ **Implementado:**
- Non-root user (nodejs user)
- Health checks com auto-restart
- Rate limiting (100-200 req/s)
- Security headers (HSTS, X-Frame-Options, etc)
- Gzip compression
- SSL/TLS ready

⚠️ **Ainda fazer:**
- [ ] SSL certificates (Let's Encrypt ou Cloudflare)
- [ ] WAF (Web Application Firewall)
- [ ] Backup automation
- [ ] Monitoring (Prometheus + Grafana)

---

## 💾 Data Persistence

Volumes Docker garantem que dados persistem:

```bash
# Ver volumes
docker volume ls | grep weats

# Listar
weats_backend_postgres_core_data
weats_backend_postgres_orders_data
weats_backend_redis_data
```

**Backup:**
```bash
./docker.sh backup-db  # Automatic backups to ./backups/
```

---

## 🐛 Troubleshooting Rápido

| Problema | Solução |
|----------|---------|
| Port 80 in use | Mudar em `docker-compose.yml`: `"8080:80"` |
| 502 Bad Gateway | `docker-compose ps` → ver gateways |
| Cannot connect DB | `docker-compose logs postgres-core` |
| Redis connection fail | `docker-compose exec redis redis-cli ping` |
| Webhooks not processing | Ver `docker-compose logs webhooks` |
| Out of memory | `docker system prune -a --volumes` |

---

## 📈 Performance

**Load Balancing:**
- Nginx usa `least_conn` para distribuir tráfego
- 3 replicas do Gateway por padrão (escalável)

**Rate Limiting:**
- Geral: 100 req/s
- Webhooks: 200 req/s (limite mais alto)

**Caching:**
- Gzip: 80% compression ratio
- HTTP cache headers
- Redis cache (aplicação)

**Health Checks:**
- Gateway: 15s interval, 5s timeout
- Databases: 10s interval, 5s timeout
- Auto-restart se down

---

## 🎯 Deployment na VPS (Dokploy)

1. **SSH na VPS:**
   ```bash
   ssh user@vps-ip
   ```

2. **Instalar Docker:**
   ```bash
   curl -fsSL https://get.docker.com -o get-docker.sh
   sudo sh get-docker.sh
   ```

3. **Clone projeto:**
   ```bash
   git clone seu-repo
   cd weats-backend
   ```

4. **Configurar .env:**
   ```bash
   cp .env.example .env
   nano .env  # Preencher com valores reais
   ```

5. **Iniciar:**
   ```bash
   docker-compose up -d
   ```

6. **Verificar:**
   ```bash
   docker-compose ps
   curl https://seu-dominio.com/health
   ```

**Ver DEPLOYMENT.md para guia completo com SSL/TLS setup!**

---

## 📞 Referências

- Docker Compose: https://docs.docker.com/compose/
- NestJS: https://docs.nestjs.com/
- Nginx: https://nginx.org/en/docs/
- PostgreSQL: https://www.postgresql.org/docs/
- Redis: https://redis.io/documentation
- Bull: https://docs.bullmq.io/

---

## ✨ Checklist Final

- [ ] Arquivo `.env.example` preenchido com valores reais em `.env`
- [ ] `docker-compose up -d` executa sem erros
- [ ] `docker-compose ps` mostra todos "Up (healthy)"
- [ ] `curl http://localhost/health` retorna 200
- [ ] `curl http://localhost/v1/users` funciona
- [ ] Bull Board acessível em `http://localhost/admin/queues`
- [ ] Webhooks estão processando (ver Bull Board)
- [ ] Health check status OK
- [ ] Backup de dados configurado
- [ ] SSL/TLS pronto para produção

**Pronto para deploy! 🚀**
