# 🚀 Deployment Guide - MongoDB Atlas Migration

Guida completa per il deployment della migrazione da Vercel Blob a MongoDB Atlas.

## 📋 Pre-Deployment Checklist

### ✅ **MongoDB Atlas Setup**
- [ ] Cluster MongoDB Atlas creato e attivo
- [ ] Database user configurato (`isru-admin` / `admin`)
- [ ] Network Access configurato (IP whitelisted)
- [ ] Connection string testata

### ✅ **Environment Variables**
- [ ] `MONGODB_CONNECTION_STRING` configurata
- [ ] `MONGODB_DATABASE_NAME` configurata (default: `isru_metrics`)
- [ ] Variabili opzionali configurate se necessario

### ✅ **Code Changes**
- [ ] AuditService aggiornato per usare `/api/audit-mongodb`
- [ ] Gestione errori graceful implementata
- [ ] Fallback per servizio non disponibile

## 🌐 Deployment Steps

### **1. Local Testing**
```bash
# Test connessione MongoDB
npm run test-mongodb

# Test health check
npm run vercel-dev
# In another terminal:
curl http://localhost:3000/api/health-mongodb
```

### **2. Environment Variables Setup**

#### **Vercel Dashboard**
```bash
# Vai su: https://vercel.com/dashboard
# Settings → Environment Variables

# Required:
MONGODB_CONNECTION_STRING=mongodb+srv://isru-admin:admin@isru-league.zxnbzud.mongodb.net/?retryWrites=true&w=majority&appName=isru-league
MONGODB_DATABASE_NAME=isru_metrics

# Optional (for optimization):
MONGODB_MAX_POOL_SIZE=20
MONGODB_SERVER_SELECTION_TIMEOUT_MS=30000
MONGODB_GRACEFUL_DEGRADATION=true
```

### **3. Deploy to Production**
```bash
# Deploy con nuovi endpoints
npm run deploy

# Verifica deployment
curl https://your-app.vercel.app/api/health-mongodb
```

### **4. Post-Deployment Verification**

#### **Health Check**
```bash
# Verifica che MongoDB sia raggiungibile
curl https://your-app.vercel.app/api/health-mongodb

# Expected response:
{
  "success": true,
  "health": {
    "status": "healthy",
    "details": {
      "connection_time_ms": 150,
      "cluster_reachable": true
    }
  }
}
```

#### **Audit Test**
```bash
# Test audit endpoint
curl -X POST https://your-app.vercel.app/api/audit-mongodb \
  -H "Content-Type: application/json" \
  -d '{
    "timestamp": "2024-08-25T10:30:00.000Z",
    "url": "https://test.com",
    "user_agent": "Test Agent",
    "localStorage_data": {"test": "data"},
    "localStorage_size": 100
  }'

# Expected response:
{
  "success": true,
  "audit_id": "anonymous_1724503800123_abc123",
  "processed_at": "2024-08-25T10:30:01.456Z"
}
```

## 🔄 Migration Process

### **1. Data Migration (Optional)**
```bash
# Se hai dati esistenti in Vercel Blob:

# Test migration (dry run)
DRY_RUN=true npm run migrate-to-mongodb

# Real migration
DRY_RUN=false npm run migrate-to-mongodb
```

### **2. Gradual Rollout**
```bash
# Opzione 1: Immediate switch
# - Tutti i nuovi audit vanno direttamente a MongoDB
# - Implementato con il deployment

# Opzione 2: Feature flag (se necessario)
# - Aggiungi MONGODB_ENABLED=true/false per controllo
```

## 🛡️ Graceful Degradation

### **Comportamento in caso di errori:**

#### **MongoDB Non Disponibile**
- ✅ **User Experience**: Non bloccato, app funziona normalmente
- ⚠️ **Data Loss**: Audit data non salvati temporaneamente
- 📝 **Logging**: Errori loggati per monitoraggio

#### **Fallback Response**
```json
{
  "success": true,
  "audit_id": "fallback_1724503800123",
  "message": "Audit service temporarily unavailable",
  "warning": "Data not persisted"
}
```

## 📊 Monitoring

### **Health Checks**
```bash
# MongoDB status
GET /api/health-mongodb

# Audit statistics
GET /api/audit-stats-mongodb

# List recent audits
GET /api/audit-list-mongodb?limit=10
```

### **Vercel Function Logs**
```bash
# Monitor in Vercel Dashboard:
# Functions → View Function Logs

# Look for:
# ✅ "Connected to MongoDB Atlas successfully"
# ❌ "MongoDB connection failed"
# ⚠️ "MongoDB unavailable, audit data lost but user not blocked"
```

### **MongoDB Atlas Dashboard**
```bash
# Monitor in MongoDB Atlas:
# - Real-time Performance
# - Database Activity
# - Connection Count
# - Storage Usage
```

## 🔧 Troubleshooting

### **Common Issues**

#### **Connection Timeout**
```bash
# Cause: Network Access not configured
# Solution: Add IP to MongoDB Atlas whitelist

# Cause: Cluster paused
# Solution: Resume cluster in MongoDB Atlas
```

#### **Authentication Failed**
```bash
# Cause: Wrong credentials
# Solution: Verify username/password in Database Access

# Cause: Wrong database permissions
# Solution: Ensure user has readWrite role
```

#### **High Latency**
```bash
# Cause: Wrong cluster region
# Solution: Use cluster closer to Vercel region

# Cause: Connection pool exhausted
# Solution: Increase MONGODB_MAX_POOL_SIZE
```

## 📈 Performance Optimization

### **Connection Pool**
```bash
# For high traffic:
MONGODB_MAX_POOL_SIZE=50
MONGODB_MIN_POOL_SIZE=5

# For low traffic:
MONGODB_MAX_POOL_SIZE=10
MONGODB_MIN_POOL_SIZE=2
```

### **Timeouts**
```bash
# For slow networks:
MONGODB_SERVER_SELECTION_TIMEOUT_MS=60000
MONGODB_CONNECT_TIMEOUT_MS=60000

# For fast networks:
MONGODB_SERVER_SELECTION_TIMEOUT_MS=5000
MONGODB_CONNECT_TIMEOUT_MS=10000
```

## 🧹 Cleanup (After Successful Migration)

### **Optional Cleanup Steps**
```bash
# 1. Remove old Vercel Blob files (if migration successful)
# 2. Remove BLOB_READ_WRITE_TOKEN from environment
# 3. Archive old audit-blob.js endpoints
# 4. Update documentation
```

## 🎉 Success Criteria

### **Migration is successful when:**
- ✅ Health check returns "healthy"
- ✅ New audits are saved to MongoDB
- ✅ Audit list/details endpoints work
- ✅ No user-facing errors
- ✅ Graceful degradation works during outages

### **Rollback Plan**
```bash
# If issues occur:
# 1. Revert to previous deployment
# 2. Switch back to Vercel Blob endpoints
# 3. Investigate MongoDB issues
# 4. Re-deploy when fixed
```

## 📞 Support

### **MongoDB Atlas Support**
- Dashboard: https://cloud.mongodb.com/
- Documentation: https://docs.atlas.mongodb.com/
- Support: MongoDB Atlas support portal

### **Vercel Support**
- Dashboard: https://vercel.com/dashboard
- Documentation: https://vercel.com/docs
- Support: Vercel support portal
