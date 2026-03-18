# Auto-Scaling Guide - Dokploy

## 📊 Monitorar & Escalar Apps no Dokploy

Agora que temos **1 replica de cada app**, o Dokploy pode escalar automaticamente baseado em **métricas**.

---

## 🎯 Métricas para Monitorar

### **Gateway API**
Escalar quando:
- ✅ CPU > 70%
- ✅ RAM > 80%
- ✅ Requests/sec > limiar configurado
- ✅ Response time > 500ms

```bash
# Métricas importantes:
- CPU Usage (%)
- Memory Usage (%)
- Requests per second (RPS)
- Response time (p95, p99)
- Error rate (%)
```

### **Webhooks Processor**
Escalar quando:
- ✅ Bull queue length > limiar (ex: 1000 jobs)
- ✅ CPU > 60%
- ✅ RAM > 80%
- ✅ Processing time > 10s

```bash
# Monitorar via Bull Board:
- /admin/queues → Ver fila tamanho
- LLEN bull:webhooks-queue:wait (Redis CLI)
```

### **Dashboard**
Escalar quando:
- ✅ CPU > 50%
- ✅ RAM > 70%
- ✅ Requests > limiar

---

## 🔧 Como Configurar Auto-Scaling no Dokploy

### **Opção 1: Auto-Scaling Nativo (Recomendado)**

No Dokploy Dashboard:

```
1. Ir para cada App (Gateway, Webhooks, Dashboard)
2. Settings → Scaling
3. Configurar:
   - Min replicas: 1
   - Max replicas: 5 (ou mais)
   - Target CPU: 70%
   - Target Memory: 80%
   - Scale-up delay: 30s
   - Scale-down delay: 300s
```

### **Opção 2: Prometheus + Custom Scaling**

Se Dokploy suporta Prometheus:

```yaml
# prometheus-rules.yml
groups:
  - name: autoscaling
    rules:
      - alert: HighGatewayLoad
        expr: |
          (rate(http_requests_total{job="gateway"}[5m]) > 100)
          and
          (process_resident_memory_bytes > 500000000)
        for: 1m
        annotations:
          scaling: "scale_gateway_to_3"

      - alert: HighWebhookQueue
        expr: redis_llen{key="bull:webhooks-queue:wait"} > 1000
        for: 30s
        annotations:
          scaling: "scale_webhooks_to_3"
```

### **Opção 3: Custom Script com Dokploy API**

```bash
#!/bin/bash

# check-and-scale.sh
# Executar via cron: */5 * * * * /path/to/check-and-scale.sh

GATEWAY_CPU=$(docker stats weats-gateway --no-stream --format "{{.CPUPerc}}" | tr -d '%')
WEBHOOKS_QUEUE=$(docker exec weats-redis redis-cli -a $REDIS_PASSWORD LLEN bull:webhooks-queue:wait)

# Scale Gateway se CPU > 70%
if (( $(echo "$GATEWAY_CPU > 70" | bc -l) )); then
    echo "⚠️ Gateway CPU high: $GATEWAY_CPU%, escalando..."
    dokploy scale --app gateway --replicas 2
fi

# Scale Webhooks se fila > 1000
if (( WEBHOOKS_QUEUE > 1000 )); then
    echo "⚠️ Webhooks queue: $WEBHOOKS_QUEUE, escalando..."
    dokploy scale --app webhooks --replicas 2
fi
```

---

## 📈 Exemplo de Escalamento Progressivo

```
Estado Normal (1 replica cada):
├── Gateway: 1 replica (CPU 45%, RAM 60%)
├── Webhooks: 1 replica (Queue: 50 jobs)
└── Dashboard: 1 replica (CPU 20%, RAM 30%)

Pico de tráfego (auto-scaling ativa):
├── Gateway: 3 replicas (CPU 65%, RAM 70%) → SCALE UP
├── Webhooks: 2 replicas (Queue: 500 jobs) → SCALE UP
└── Dashboard: 1 replica (CPU 35%, RAM 50%)

Depois de 10min normal:
├── Gateway: 2 replicas (CPU 52%, RAM 62%) → SCALE DOWN
├── Webhooks: 1 replica (Queue: 20 jobs) → SCALE DOWN
└── Dashboard: 1 replica (CPU 22%, RAM 32%)

Volta ao Normal:
├── Gateway: 1 replica (CPU 45%, RAM 60%)
├── Webhooks: 1 replica (Queue: 5 jobs)
└── Dashboard: 1 replica (CPU 18%, RAM 28%)
```

---

## 🔍 Monitore Métricas em Tempo Real

### **Via Dokploy UI:**
```
Dashboard → Resources → Live metrics
- CPU/Memory/Disk
- Network I/O
- Restart count
```

### **Via Prometheus (se configurado):**
```
http://prometheus:9090/graph

Queries úteis:
- rate(http_requests_total[5m])
- process_resident_memory_bytes
- container_cpu_usage_seconds_total
```

### **Via Docker Stats:**
```bash
docker stats weats-gateway weats-webhooks weats-dashboard --no-stream
```

### **Via Bull Board (Webhooks):**
```
http://seu-dominio.com/admin/queues

Métricas:
- Waiting jobs
- Active jobs
- Delayed jobs
- Failed jobs
```

---

## 📋 Checklist de Setup Auto-Scaling

- [ ] Dokploy instalado e configurado
- [ ] PostgreSQL, Redis criados como serviços
- [ ] 3 apps deployados (Gateway, Webhooks, Dashboard)
- [ ] Health checks configurados para cada app
- [ ] Auto-scaling ativado com métricas
- [ ] Alertas configurados (Slack, PagerDuty, email)
- [ ] Prometheus opcional (para métricas detalhadas)
- [ ] Monitoramento de logs centralizado (opcional)
- [ ] Testes de carga para validar scaling

---

## 🚨 Alertas Recomendados

### **Gateway**
- CPU > 80% por 2min → Alert "Gateway CPU high"
- Memory > 90% → Alert "Gateway memory critical"
- Error rate > 5% → Alert "Gateway errors increasing"
- Response time p95 > 1s → Alert "Gateway slow"

### **Webhooks**
- Queue size > 5000 → Alert "Webhook queue backlog"
- Processing time > 30s → Alert "Slow webhook processing"
- Failed jobs > 100 → Alert "Failed webhooks"

### **Database**
- Connection pool > 90% → Alert "DB connections high"
- Slow queries > 1s → Alert "Slow database queries"

### **Redis**
- Memory > 80% → Alert "Redis memory high"
- Evicted keys → Alert "Redis evicting keys"

---

## 🎯 Boas Práticas

✅ **DO:**
- Começar com 1 replica, deixar métricas estabilizarem
- Testar carga com ferramentas (k6, wrk, Apache Bench)
- Definir limites de CPU/RAM por container
- Monitorar antes de assumir que tudo está ok
- Documentar quando e por quê escalar cada app

❌ **DON'T:**
- Hardcoding 3 replicas sem monitoramento
- Escalar sem entender o problema
- Ignorar alertas
- Deixar serviços em estado unhealthy
- Deploy sem testar auto-scaling primeiro

---

## 🧪 Testar Auto-Scaling

### **1. Teste de Carga no Gateway**
```bash
# Usar k6 ou Apache Bench
ab -n 10000 -c 100 http://seu-dominio.com/health

# Monitorar métricas
watch -n 1 'docker stats weats-gateway --no-stream'

# Verificar se escala para 2/3 replicas
docker ps | grep weats-gateway
```

### **2. Teste de Fila nos Webhooks**
```bash
# Simular muitos webhooks
for i in {1..5000}; do
  curl -X POST http://seu-dominio.com/v1/webhooks/stripe \
    -H "stripe-signature: fake" \
    -d '{"id":"evt_$i"}'
done

# Monitorar fila
watch -n 1 'docker exec weats-redis redis-cli LLEN bull:webhooks-queue:wait'

# Verificar se escala webhooks
docker ps | grep weats-webhooks
```

---

## 📞 Troubleshooting Auto-Scaling

| Problema | Solução |
|----------|---------|
| Apps não escalam | Verificar Dokploy scaling policy; aumentar CPU threshold |
| Escala lenta (30s+) | Normal, é o delay de proteção; reduzir se necessário |
| Scales demasiado | Aumentar scale-down delay; revisar thresholds |
| Container killed OOM | Aumentar limite de RAM; revisar vazamentos de memória |
| CPU baixo mas alto latency | Problema de I/O ou database; otimizar queries |

---

## 📚 Recursos

- Dokploy Docs: https://dokploy.com/docs
- Prometheus: https://prometheus.io/docs
- Bull Board: https://github.com/felixmosh/bull-board
- Load Testing: https://k6.io/

---

**Resultado: Apps escaláveis, automáticos e eficientes! 🚀**
