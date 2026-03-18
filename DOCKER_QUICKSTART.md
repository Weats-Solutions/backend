# Quick Start: Docker Compose Deployment

## 🚀 5 Minutos para Começar (Locally)

```bash
# 1. Prepare environment
cp .env.example .env
nano .env  # Edit with your values

# 2. Start all services
docker-compose up -d

# 3. Check status
docker-compose ps

# 4. Test API
curl http://localhost/health

# Done! 🎉
```

---

## 🐛 Common Issues & Fixes

### ❌ "docker-compose: command not found"
```bash
# Install Docker Desktop or use Docker v2+
# Ubuntu/Debian:
sudo apt-get install docker-compose-plugin
# Then use: docker compose (not docker-compose)
# Or alias: alias docker-compose='docker compose'
```

### ❌ ".env file not found"
```bash
cp .env.example .env
# Edit .env with actual values
```

### ❌ "Port 80 already in use"
```bash
# Change Nginx port in docker-compose.yml:
# ports:
#   - "8080:80"  # Use 8080 instead
# Then: docker-compose up -d
```

### ❌ "502 Bad Gateway"
```bash
# Gateway containers are down or unhealthy
docker-compose logs gateway1 gateway2 gateway3

# If unhealthy, check:
docker-compose restart gateway1 gateway2 gateway3
```

### ❌ "Cannot connect to PostgreSQL"
```bash
# Check if postgres containers are healthy
docker-compose ps | grep postgres

# Test connection:
docker-compose exec postgres-core psql -U postgres -c "SELECT 1"

# Check error:
docker-compose logs postgres-core
```

### ❌ "Cannot connect to Redis"
```bash
# Test Redis connection
docker-compose exec redis redis-cli -a YOUR_PASSWORD ping

# Should return: PONG

# Check logs:
docker-compose logs redis
```

### ❌ "Webhooks not processing"
```bash
# 1. Check if webhooks container is healthy
docker-compose ps webhooks

# 2. Check logs
docker-compose logs -f webhooks

# 3. Check Redis queue status
docker-compose exec redis redis-cli -a PASSWORD
SELECT 3
LLEN bull:webhooks-queue:wait

# 4. Access Bull Board for UI monitoring
open http://localhost/admin/queues
```

### ❌ "Out of memory / Disk space"
```bash
# Clean up unused Docker resources
docker system prune -a --volumes

# Or remove only unused volumes
docker volume prune
```

---

## ✅ Health Checks

```bash
# Show health status of all containers
docker-compose ps

# Column "STATUS" shows:
# - Up (healthy)     ✅
# - Up (unhealthy)   ⚠️
# - Up (starting)    ⏳
# - Exited           ❌

# Detailed health info
docker inspect weats-gateway-1 | grep -A 5 "Health"

# Force health check
docker exec weats-gateway-1 curl http://localhost:4000/health
```

---

## 📊 Monitoring

### Real-time Logs
```bash
# All services
docker-compose logs -f

# Specific service (follow mode)
docker-compose logs -f webhooks
docker-compose logs -f gateway1

# Last 50 lines
docker-compose logs --tail 50 nginx

# Without following
docker-compose logs
```

### Service Status
```bash
# Basic status
docker-compose ps

# Resource usage
docker stats

# Specific container details
docker-compose exec gateway1 curl http://localhost:4000
```

### Queue Status (Webhooks)
```bash
# Via Redis CLI
docker-compose exec redis redis-cli -a PASSWORD
SELECT 3
KEYS *
LLEN bull:webhooks-queue:wait
LLEN bull:webhooks-queue:active

# Via Bull Board UI
open http://localhost/admin/queues
```

---

## 🔧 Common Management Tasks

### Restart a Single Service
```bash
docker-compose restart gateway1
docker-compose restart webhooks
```

### View Logs While Restarting
```bash
docker-compose restart gateway1 && docker-compose logs -f gateway1
```

### Rebuild Images (code changes)
```bash
docker-compose build
docker-compose up -d
```

### Backup Database Before Changes
```bash
docker exec weats-postgres-core pg_dump -U postgres core > backup.sql
```

### Execute Commands Inside Container
```bash
# Run shell
docker-compose exec gateway1 sh

# Run Prisma migrations
docker-compose exec gateway1 npx prisma migrate deploy

# Install package
docker-compose exec gateway1 npm install package-name
```

---

## 🔐 Security Checklist

- [ ] Changed all `.env` passwords (not using defaults)
- [ ] Set `NODE_ENV=production` in production
- [ ] Configured HTTPS/SSL certificates
- [ ] Updated firewall to only allow ports 80/443
- [ ] Set strong database passwords
- [ ] Set Redis password (not blank)
- [ ] Restricted database access to internal network only
- [ ] Set up regular backups
- [ ] Monitored error logs for security issues

---

## 📝 Important Notes

1. **First Time Setup**: Build can take 5-10 minutes
2. **Health Checks**: Services take ~10-30s to become healthy
3. **Database**: First migration runs automatically on container start
4. **Load Balancer**: Nginx automatically distributes traffic to 3 Gateway replicas
5. **Volumes**: Data persists even after `docker-compose down`
6. **Auto-restart**: Services restart automatically if they crash

---

## 🆘 Emergency Procedures

### Stuck Container?
```bash
# Kill and restart
docker-compose restart SERVICE_NAME
```

### All Services Down?
```bash
# Full restart
docker-compose down
docker-compose up -d
```

### Complete Reset (Deletes ALL data!)
```bash
docker-compose down -v
docker-compose up -d
```

### Out of Disk Space?
```bash
# See what's taking space
docker system df

# Clean everything unused
docker system prune -a --volumes

# Remove specific image
docker image rm IMAGE_ID
```

---

## 📚 Documentation

- **Full Guide**: See `DEPLOYMENT.md` for comprehensive guide
- **Nginx Config**: See `nginx.conf` for load balancer configuration
- **Docker Compose**: See `docker-compose.yml` for service definitions
- **Dockerfiles**: See `Dockerfile.gateway` and `Dockerfile.webhooks`
- **Helper Script**: Run `./docker.sh help` for all commands

---

## 🎯 Next Steps

1. **Local Testing**: Run `./docker.sh test-api` and `./docker.sh test-db`
2. **VPS Deployment**: Follow "Deploy na VPS" section in `DEPLOYMENT.md`
3. **Monitoring**: Set up monitoring dashboard (optional but recommended)
4. **Backups**: Configure automated database backups
5. **CI/CD**: Set up GitHub Actions for automated deployments

---

## 💡 Pro Tips

```bash
# Use the helper script for common tasks
chmod +x docker.sh

./docker.sh start          # Start everything
./docker.sh status         # Check status
./docker.sh logs webhooks  # See webhook logs
./docker.sh test-api       # Test connectivity
./docker.sh backup-db      # Backup databases
./docker.sh health         # Health status

# Monitor everything in one terminal
docker stats --no-stream

# Follow logs from multiple containers
docker-compose logs -f gateway1 gateway2 gateway3 webhooks
```

---

**Questions?** Check `DEPLOYMENT.md` for detailed troubleshooting.
