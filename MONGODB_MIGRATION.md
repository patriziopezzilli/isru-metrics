# 🚀 MongoDB Atlas Migration Guide

Guida completa per la migrazione da Vercel Blob Store a MongoDB Atlas per il sistema di audit di ISRU Metrics.

## 📋 Panoramica

Questa migrazione porta i seguenti vantaggi:

### ✅ **Vantaggi MongoDB Atlas**
- **Query avanzate**: Aggregazioni, filtri complessi, ricerche full-text
- **Costi prevedibili**: Free tier 512MB + piani scalabili
- **Backup automatici**: Point-in-time recovery incluso
- **Performance**: Indici ottimizzati per query veloci
- **Scalabilità**: Auto-scaling senza vendor lock-in
- **Analytics**: Dashboard integrato per monitoraggio

### ❌ **Limitazioni Vercel Blob risolte**
- Nessuna possibilità di query complesse
- Costi imprevedibili per operazioni frequenti
- Nessun backup automatico
- Difficoltà nell'analisi dei dati

## 🏗️ Architettura Nuova

### **Struttura MongoDB**
```javascript
// Collection: audit_logs
{
  _id: ObjectId,
  audit_id: "username_timestamp_random",
  timestamp: ISODate,
  server_timestamp: ISODate,
  username: "patriziopezzilli",
  localStorage_data: { ... },
  localStorage_size: 2048,
  date_key: "2024-08-25", // Per query veloci
  username_lower: "patriziopezzilli", // Per ricerche case-insensitive
  metadata: {
    source: "isru-metrics-app",
    migration_source: "vercel_blob"
  }
}
```

### **Indici Ottimizzati**
- `audit_id` (unique)
- `username_lower + created_at`
- `date_key + created_at`
- `created_at` (per ordinamento)
- Text search su `username` e `url`

## 🚀 Setup MongoDB Atlas

### 1. **Crea Cluster**
```bash
# 1. Vai su https://cloud.mongodb.com/
# 2. Crea nuovo progetto "ISRU Metrics"
# 3. Crea cluster M0 (Free Tier - 512MB)
# 4. Scegli regione più vicina (es. Europe West)
```

### 2. **Configura Sicurezza**
```bash
# Database Access:
# - Username: isru_admin
# - Password: [genera password sicura]
# - Role: readWrite su database isru_metrics

# Network Access:
# - Per sviluppo: aggiungi il tuo IP
# - Per produzione: aggiungi IP Vercel o 0.0.0.0/0 (meno sicuro)
```

### 3. **Ottieni Connection String**
```bash
# Nel dashboard MongoDB Atlas:
# 1. Clicca "Connect"
# 2. Scegli "Connect your application"
# 3. Copia la connection string:

mongodb+srv://isru_admin:<password>@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority
```

## 🔧 Configurazione Locale

### 1. **Installa Dipendenze**
```bash
# Rimuovi dipendenze PostgreSQL
npm uninstall pg @types/pg

# Installa MongoDB
npm install mongodb

# Verifica package.json
{
  "dependencies": {
    "mongodb": "^6.3.0"
  }
}
```

### 2. **Configura Environment Variables**
```bash
# Copia il template
cp .env.mongodb.example .env.local

# Modifica .env.local con i tuoi valori:
MONGODB_CONNECTION_STRING=mongodb+srv://isru_admin:your_password@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority
MONGODB_DATABASE_NAME=isru_metrics
```

### 3. **Test Connessione**
```bash
# Crea un test script
node -e "
import { createMongoDBService } from './src/services/mongodbService.js';
const service = createMongoDBService();
await service.connect();
console.log('✅ MongoDB connection successful!');
await service.disconnect();
"
```

## 📦 Migrazione Dati

### 1. **Preparazione**
```bash
# Verifica dati Vercel Blob esistenti
vercel blob list

# Configura migrazione (dry run)
export DRY_RUN=true
export VERBOSE=true
```

### 2. **Esecuzione Migrazione**
```bash
# Test run (non modifica dati)
node scripts/migrate-vercel-to-mongodb.js

# Migrazione reale
export DRY_RUN=false
node scripts/migrate-vercel-to-mongodb.js
```

### 3. **Verifica Risultati**
```bash
# Il script genera un report:
# migration-report-2024-08-25T10-30-00-000Z.json

# Verifica in MongoDB Atlas Dashboard:
# - Vai su Collections
# - Controlla audit_logs collection
# - Verifica numero documenti migrati
```

## 🔄 Aggiornamento Applicazione

### 1. **API Endpoints Aggiornati**
```javascript
// Vecchi (Vercel Blob)
/api/audit-blob
/api/audit-list
/api/audit-details

// Nuovi (MongoDB)
/api/audit-mongodb
/api/audit-list-mongodb
/api/audit-details-mongodb
/api/audit-stats-mongodb (nuovo!)
```

### 2. **Frontend Service**
```typescript
// src/services/auditService.ts
// Endpoint automaticamente aggiornato a /api/audit-mongodb
```

### 3. **Nuove Funzionalità**
```javascript
// Statistiche avanzate
GET /api/audit-stats-mongodb
{
  "total_audits": 1250,
  "unique_users": 45,
  "avg_localStorage_size": 2048,
  "top_users": [...]
}

// Query avanzate
GET /api/audit-list-mongodb?username=patriziopezzilli&date_from=2024-08-01
```

## 🌐 Deploy Produzione

### 1. **Vercel Environment Variables**
```bash
# Nel Vercel Dashboard > Settings > Environment Variables:
MONGODB_CONNECTION_STRING=mongodb+srv://...
MONGODB_DATABASE_NAME=isru_metrics

# Opzionali per ottimizzazione:
MONGODB_MAX_POOL_SIZE=20
MONGODB_SERVER_SELECTION_TIMEOUT_MS=5000
```

### 2. **Deploy**
```bash
# Deploy con nuovi endpoints
vercel --prod

# Verifica funzionamento
curl https://your-app.vercel.app/api/audit-stats-mongodb
```

### 3. **Cleanup Vercel Blob (opzionale)**
```bash
# Dopo verifica che tutto funziona:
# - Rimuovi BLOB_READ_WRITE_TOKEN da Vercel
# - Elimina Vercel Blob Store dal dashboard
# - Rimuovi file api/audit-blob.js, api/audit-list.js, api/audit-details.js
```

## 💰 Costi Comparativi

### **Vercel Blob (attuale)**
```
Free: 5GB storage + bandwidth
Pro: $0.15/GB storage + $0.10/GB bandwidth
Stima mensile: ~$0.002 (praticamente gratis)
```

### **MongoDB Atlas (nuovo)**
```
M0 Free: 512MB storage + 100 connessioni = GRATIS
M2 Shared: $9/mese (2GB + backup)
M5 Dedicated: $25/mese (5GB + backup + performance)

Per il tuo uso: GRATIS con M0 Free Tier!
```

## 📊 Monitoraggio

### **MongoDB Atlas Dashboard**
- Real-time metrics
- Query performance
- Storage usage
- Connection monitoring

### **Nuove Query Possibili**
```javascript
// Top utenti per attività
db.audit_logs.aggregate([
  { $group: { _id: "$username", count: { $sum: 1 } } },
  { $sort: { count: -1 } },
  { $limit: 10 }
])

// Trend giornaliero
db.audit_logs.aggregate([
  { $group: { _id: "$date_key", count: { $sum: 1 } } },
  { $sort: { _id: 1 } }
])

// Analisi localStorage size
db.audit_logs.aggregate([
  { $group: { 
    _id: null, 
    avg: { $avg: "$localStorage_size" },
    max: { $max: "$localStorage_size" }
  }}
])
```

## 🔍 Troubleshooting

### **Errori Comuni**
```bash
# Connection timeout
# Soluzione: Verifica Network Access in MongoDB Atlas

# Authentication failed
# Soluzione: Verifica username/password e Database Access

# Collection not found
# Soluzione: Il servizio crea automaticamente le collections al primo uso
```

### **Performance**
```bash
# Slow queries
# Soluzione: Verifica che gli indici siano stati creati correttamente

# Memory usage
# Soluzione: Usa paginazione nelle query (limit/skip)
```

## ✅ Checklist Migrazione

- [ ] MongoDB Atlas cluster creato
- [ ] Database user configurato
- [ ] Network access configurato
- [ ] Connection string testata
- [ ] Dipendenze aggiornate (mongodb installato, pg rimosso)
- [ ] Environment variables configurate
- [ ] Migrazione dati eseguita
- [ ] Verifica dati in MongoDB Atlas
- [ ] Deploy produzione
- [ ] Test endpoints in produzione
- [ ] Cleanup Vercel Blob (opzionale)

## 🎉 Risultato Finale

Dopo la migrazione avrai:
- ✅ **Sistema più potente** con query avanzate
- ✅ **Costi ridotti** (gratis con Free Tier)
- ✅ **Backup automatici** inclusi
- ✅ **Monitoraggio avanzato** con dashboard
- ✅ **Scalabilità** senza vendor lock-in
- ✅ **Performance migliori** con indici ottimizzati
