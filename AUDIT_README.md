# 📊 ISRU Metrics - Audit System

Sistema di audit asincrono per tracciare i dati del localStorage a scopo di analisi.

## 🎯 Obiettivo

Raccogliere dati anonimi e non bloccanti dal localStorage degli utenti per:
- Capire come viene utilizzata l'app
- Analizzare i pattern di utilizzo
- Debuggare problemi sui dispositivi degli utenti
- Ottimizzare l'esperienza utente

## 🔧 Come Funziona

### 1. Raccolta Automatica
- **Quando**: All'avvio dell'app (dopo il caricamento completo)
- **Cosa**: Solo chiavi localStorage relative a ISRU (`isru-username`, `friends-league`, etc.)
- **Come**: In modo completamente asincrono, senza bloccare l'UI

### 2. Invio Dati
- **Endpoint**: `/api/audit-localstorage`
- **Metodo**: POST asincrono con retry automatico
- **Fallback**: Se fallisce, non influenza l'app (fail-safe)

### 3. Storage
- **Sviluppo**: File JSON in `audit-logs/`
- **Produzione**: Database PostgreSQL (quando configurato)

## 📁 File del Sistema

```
src/services/auditService.ts          - Servizio principale audit
api/audit-localstorage.js            - Endpoint API per ricevere audit
database/audit-schema.sql            - Schema database per audit
src/components/AuditDebugComponent.tsx - Componente debug (solo per te)
```

## 🚀 Utilizzo

### Automatico
Il sistema si attiva automaticamente quando l'app viene caricata:

```typescript
// In App.tsx - già implementato
import AuditService from './services/auditService';

useEffect(() => {
  if (appLoaded) {
    AuditService.auditLocalStorage({
      includeAllKeys: false, // Solo chiavi ISRU
      maxDataSize: 50000,    // Max 50KB
    });
  }
}, [appLoaded]);
```

### Manuale (per debug)
```typescript
// Audit immediato
AuditService.auditNow();

// Audit con opzioni
AuditService.auditLocalStorage({
  includeAllKeys: true,     // Include TUTTE le chiavi localStorage
  maxDataSize: 100000,      // Limite dimensioni
  onSuccess: () => console.log('✅ Audit completed'),
  onError: (err) => console.error('❌ Audit failed', err)
});

// Statistiche localStorage (senza invio)
const stats = AuditService.getLocalStorageStats();
console.log(stats);
// Output: { totalKeys: 5, isruKeys: 3, totalSize: 1234, hasUsername: true, hasFriends: true }
```

## 🔍 Componente Debug

Solo per l'utente `patriziopezzilli` viene mostrato un pannello debug che permette di:

- **Vedere statistiche localStorage** in tempo reale
- **Testare audit manuale** (solo chiavi ISRU)
- **Testare audit completo** (tutte le chiavi)
- **Monitorare status** invio

![Debug Panel](https://via.placeholder.com/600x300/f8f9fa/495057?text=🧪+Audit+Debug+Panel)

## 📊 Dati Raccolti

### Metadata
```json
{
  "timestamp": "2024-08-24T10:30:00Z",
  "server_timestamp": "2024-08-24T10:30:01Z",
  "username": "patriziopezzilli",
  "session_id": "1724503800123-abc123def",
  "url": "https://isru-metrics.vercel.app",
  "user_agent": "Mozilla/5.0...",
  "client_ip": "192.168.1.1",
  "app_version": "1.0.0"
}
```

### localStorage Data
```json
{
  "localStorage_data": {
    "isru-username": "patriziopezzilli",
    "friends-league": [
      { "username": "friend1", "profileData": null },
      { "username": "friend2", "profileData": {...} }
    ],
    "user-goals": [
      { "id": "goal1", "targetPosition": 100, "isActive": true }
    ]
  },
  "localStorage_size": 2048
}
```

## 🗄️ Database Schema

### Tabella Principal
```sql
CREATE TABLE audit_localstorage (
    id BIGSERIAL PRIMARY KEY,
    client_timestamp TIMESTAMP WITH TIME ZONE NOT NULL,
    server_timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    username VARCHAR(100),
    session_id VARCHAR(100) NOT NULL,
    url TEXT,
    user_agent TEXT,
    client_ip INET,
    app_version VARCHAR(20),
    localStorage_data JSONB NOT NULL,
    localStorage_size INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
```

### Query di Analisi
```sql
-- Audit recenti
SELECT * FROM audit_localstorage ORDER BY server_timestamp DESC LIMIT 10;

-- Statistiche giornaliere
SELECT * FROM audit_stats LIMIT 30;

-- Utenti più attivi
SELECT * FROM user_audit_summary ORDER BY audit_count DESC LIMIT 10;

-- Utenti con friends-league
SELECT username, localStorage_data->'friends-league' as friends
FROM audit_localstorage 
WHERE localStorage_data ? 'friends-league' 
ORDER BY server_timestamp DESC;
```

## ⚙️ Configurazione

### Variabili d'Ambiente
```bash
# Database (opzionale)
DATABASE_URL=postgresql://user:pass@host:5432/db

# Analytics esterni (opzionale)
ANALYTICS_WEBHOOK_URL=https://your-analytics-service.com/webhook
ANALYTICS_API_KEY=your-api-key

# Sviluppo
NODE_ENV=development  # Abilita salvataggio file JSON
```

### Setup Database
```bash
# Applica schema audit
psql -U postgres -d isru_metrics -f database/audit-schema.sql

# Test connessione
psql -U postgres -d isru_metrics -c "SELECT COUNT(*) FROM audit_localstorage;"
```

## 🔐 Privacy e Sicurezza

### Cosa Viene Raccolto
- ✅ **Chiavi ISRU**: `isru-username`, `friends-league`, goals, cache
- ❌ **Chiavi sensibili**: Password, token, dati personali di terze parti
- ❌ **Dati di altre app**: Solo localStorage relativo a ISRU

### Sicurezza
- **Anonimizzazione**: IP mascherati in produzione
- **Encryption**: Dati trasmessi via HTTPS
- **Retention**: Auto-cleanup dopo 30 giorni (configurabile)

### Opt-out
Per disabilitare l'audit (se necessario):
```typescript
// Disabilita audit globalmente
window.DISABLE_AUDIT = true;

// O modifica AuditService per rispettare una preferenza utente
```

## 📈 Analisi Possibili

### User Behavior
- Frequenza di utilizzo app
- Retention utenti
- Pattern di utilizzo features

### Technical Metrics
- Dimensioni localStorage medie
- Performance localStorage
- Errori comuni

### Feature Usage
- Utilizzo friends-league
- Creazione goals
- Interazione con cache

## 🚨 Troubleshooting

### Audit Non Funziona
```bash
# Verifica endpoint
curl -X POST http://localhost:3000/api/audit-localstorage \
  -H "Content-Type: application/json" \
  -d '{"test": true}'

# Verifica database
psql -U postgres -d isru_metrics -c "SELECT COUNT(*) FROM audit_localstorage;"

# Verifica logs
tail -f audit-logs/audit_$(date +%Y-%m-%d).jsonl
```

### Performance Issues
- Audit è **completamente asincrono**
- Non blocca mai l'UI
- Fallback automatico se endpoint non disponibile
- Retry automatico con exponential backoff

## 🎯 Prossimi Passi

1. **Test** con il debug component
2. **Monitora** i primi audit
3. **Analizza** i pattern nei dati
4. **Ottimizza** basandoti sui risultati

Il sistema è **production-ready** e **fail-safe** - non influenzerà mai l'esperienza utente! 🚀
