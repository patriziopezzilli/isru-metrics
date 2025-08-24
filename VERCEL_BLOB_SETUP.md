# 🗄️ ISRU Metrics - Vercel Blob Audit Setup

Sistema di audit completo utilizzando **Vercel Blob Storage** per persistenza scalabile dei dati.

## 🎯 Perché Vercel Blob?

### ✅ **Vantaggi per Audit**
- **Unlimited writes**: Perfetto per audit continui
- **Pay-per-use**: Costi scalabili in base all'utilizzo
- **No limits**: Nessun limite sul numero di file o dimensioni
- **Automatic indexing**: Organizzazione per data integrata
- **Fast access**: Lettura rapida per analisi

### ❌ **Perché NON Edge Config**
- **Write limits**: Solo 1000 writes/mese (troppo poco)
- **Size limits**: Max 512KB totali (insufficiente)
- **Read-optimized**: Progettato per configurazioni, non audit logs

## 🚀 Setup Completo

### 1. Configurazione Vercel Blob

```bash
# 1. Installa Vercel CLI
npm i -g vercel

# 2. Login e link progetto
vercel login
vercel link

# 3. Crea Blob Store
# Vai su https://vercel.com/dashboard/stores
# Clicca "Create Store" > "Blob"
# Copia il token generato

# 4. Aggiungi variabile d'ambiente
vercel env add BLOB_READ_WRITE_TOKEN
# Incolla il token quando richiesto

# 5. Pull delle env vars per sviluppo locale
vercel env pull
```

### 2. Install Dependencies

```bash
# Aggiungi Vercel Blob SDK
npm install @vercel/blob

# Verifica package.json
{
  "dependencies": {
    "@vercel/blob": "^0.23.4"
  }
}
```

### 3. File Structure

Il sistema organizza automaticamente i file così:

```
Vercel Blob Storage:
├── audit/
│   ├── 2024-08-24/
│   │   ├── patriziopezzilli_1724503800123_abc123def.json
│   │   ├── user2_1724504000456_def456ghi.json
│   │   └── anonymous_1724504200789_ghi789jkl.json
│   ├── 2024-08-25/
│   │   └── ...
│   └── index/
│       ├── 2024-08-24.json (index giornaliero)
│       └── 2024-08-25.json
```

## 📁 File del Sistema

### API Endpoints
```
api/audit-blob.js        - Salva audit su Vercel Blob
api/audit-list.js        - Lista audit per data
api/audit-details.js     - Dettagli audit specifico
```

### Components
```
src/services/auditService.ts         - Servizio audit (aggiornato per Blob)
src/components/AuditDebugComponent.tsx - Debug panel
src/components/AuditViewer.tsx        - Visualizzatore audit data
```

### Configuration
```
.env.blob.example        - Template configurazione
package.json            - Dependencies aggiornate
```

## 🔧 Utilizzo

### Audit Automatico (già attivo)
```typescript
// In App.tsx - già implementato
useEffect(() => {
  if (appLoaded) {
    AuditService.auditLocalStorage({
      includeAllKeys: false,
      maxDataSize: 50000
    });
  }
}, [appLoaded]);
```

### Visualizzazione Dati
```typescript
// Componente per vedere i dati salvati
import AuditViewer from './components/AuditViewer';

// Nel tuo admin panel o debug area
<AuditViewer />
```

### API Calls Dirette
```bash
# Lista audit per data
GET /api/audit-list?date=2024-08-24

# Dettagli audit specifico  
GET /api/audit-details?id=patriziopezzilli_1724503800123_abc123def

# Response esempio
{
  "success": true,
  "date": "2024-08-24",
  "audit_count": 15,
  "audits": [
    {
      "audit_id": "patriziopezzilli_1724503800123_abc123def",
      "url": "https://blob.vercel-storage.com/...",
      "uploadedAt": "2024-08-24T10:30:00Z",
      "size": 2048
    }
  ]
}
```

## 📊 Struttura Dati Audit

### Single Audit Record
```json
{
  "audit_id": "patriziopezzilli_1724503800123_abc123def",
  "timestamp": "2024-08-24T10:30:00Z",
  "server_timestamp": "2024-08-24T10:30:01Z",
  "username": "patriziopezzilli",
  "session_id": "1724503800123-abc123def",
  "url": "https://isru-metrics.vercel.app",
  "user_agent": "Mozilla/5.0...",
  "client_ip": "192.168.1.1",
  "app_version": "1.0.0",
  "localStorage_data": {
    "isru-username": "patriziopezzilli",
    "friends-league": [...],
    "user-goals": [...]
  },
  "localStorage_size": 2048
}
```

### Daily Index
```json
{
  "date": "2024-08-24",
  "last_updated": "2024-08-24T23:59:59Z",
  "audit_count": 157,
  "audits": [
    {
      "audit_id": "...",
      "timestamp": "...",
      "username": "...",
      "localStorage_size": 2048,
      "keys_count": 5
    }
  ]
}
```

## 🔍 Debug & Testing

### Debug Component (solo per te)
Quando fai login come `patriziopezzilli`, vedrai:
- **📊 Audit Debug Panel** - Test manuali
- **📋 Audit Viewer** - Visualizzazione dati salvati

### Test Manuali
```typescript
// Test audit immediato
AuditService.auditNow();

// Verifica statistiche
const stats = AuditService.getLocalStorageStats();
console.log(stats);

// Test con opzioni avanzate
AuditService.auditLocalStorage({
  includeAllKeys: true,
  maxDataSize: 100000,
  onSuccess: () => console.log('✅ Saved to Blob'),
  onError: (err) => console.error('❌ Failed', err)
});
```

### Verifica Blob Storage
```bash
# Via Vercel CLI
vercel blob list

# Via Dashboard
https://vercel.com/dashboard/stores
```

## 💰 Costi e Limiti

### Vercel Blob Pricing
- **Free tier**: 5GB storage + bandwidth
- **Pro**: $0.15/GB storage + $0.10/GB bandwidth
- **No operation limits**: Upload/download illimitati

### Stima Costi per ISRU Metrics
```
Assumendo:
- 100 utenti attivi/giorno
- 2KB per audit
- 1 audit per sessione

Mensile:
- Storage: 100 * 2KB * 30 = 6MB ≈ $0.001
- Bandwidth: ~12MB ≈ $0.001
- Totale: ~$0.002/mese

Praticamente GRATIS! 🎉
```

## 🔧 Administration

### Cleanup Automatico (opzionale)
```javascript
// In una funzione cron o scheduled
// Elimina audit più vecchi di 90 giorni
const cutoffDate = new Date();
cutoffDate.setDate(cutoffDate.getDate() - 90);

const { blobs } = await list({
  prefix: `audit/${cutoffDate.toISOString().split('T')[0]}`
});

// Elimina blobs vecchi
for (const blob of blobs) {
  await del(blob.url);
}
```

### Export Bulk Data
```typescript
// Export di tutti gli audit per analisi
async function exportAllAudits(startDate: string, endDate: string) {
  const allAudits = [];
  
  // Itera tra le date
  let currentDate = new Date(startDate);
  const end = new Date(endDate);
  
  while (currentDate <= end) {
    const dateStr = currentDate.toISOString().split('T')[0];
    const response = await fetch(`/api/audit-list?date=${dateStr}`);
    const data = await response.json();
    
    allAudits.push(...data.audits);
    currentDate.setDate(currentDate.getDate() + 1);
  }
  
  return allAudits;
}
```

## 🚀 Deploy

### Production Setup
```bash
# 1. Deploy su Vercel
vercel --prod

# 2. Configura environment variables su Vercel Dashboard
# BLOB_READ_WRITE_TOKEN (automatico se hai creato il Blob Store)

# 3. Verifica funzionamento
curl https://your-app.vercel.app/api/audit-list?date=2024-08-24
```

### Monitoring
```typescript
// Aggiungi logging in audit-blob.js per monitorare utilizzo
console.log('📊 Audit saved:', {
  size: jsonData.length,
  user: auditData.username,
  timestamp: auditData.server_timestamp
});
```

## ✅ Checklist Setup

- [ ] **Vercel Blob Store** creato
- [ ] **BLOB_READ_WRITE_TOKEN** configurato
- [ ] **Dependencies** installate (`@vercel/blob`)
- [ ] **API endpoints** deployati
- [ ] **AuditService** aggiornato
- [ ] **Test** audit manuale funzionante
- [ ] **Viewer component** accessibile
- [ ] **Monitoring** attivo

Il sistema è **production-ready** e scalabile! 🚀

## 🎯 Prossimi Passi

1. **Deploy** e test in produzione
2. **Monitor** primi audit data
3. **Analisi** pattern utilizzo
4. **Dashboard** analytics avanzato

Hai tutto quello che serve per audit scalabile con Vercel Blob! 💪
