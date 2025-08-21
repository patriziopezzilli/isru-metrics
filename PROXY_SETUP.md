# ISRU League - Universal Proxy Setup

## Sistema di Proxy Unificato

Il progetto ora utilizza un **sistema di proxy proprietario unificato** che gestisce tutte le API esterne:

### API Supportate:
1. **ISRU Leaderboard** - `https://isrucamp.com/api/users/leaderboard/score-distribution/`
2. **SneakerDB Profiles** - `https://tools.sneakerdb.net/api/isrucamp-user-profile/`

### Endpoint Proxy:
- **Universal Proxy**: `/api/universal-proxy` (raccomandato)
- **ISRU Specific**: `/api/isru-proxy` (backup)
- **SneakerDB Specific**: `/api/sneakerdb-proxy` (backup)

## Deploy su Vercel

### 1. Installa Vercel CLI
```bash
npm install -g vercel
```

### 2. Login e Deploy
```bash
vercel login
npm run deploy
```

### 3. Configura il dominio (opzionale)
- Vai su Vercel Dashboard
- Aggiungi un dominio personalizzato tipo `isru-league.vercel.app`

## Test in Locale

### Sviluppo con Vercel Dev
```bash
npm run vercel-dev
```

Questo avvierà:
- Frontend React su `http://localhost:3000`
- API proxy su `http://localhost:3000/api/isru-proxy`

### Test Manuale del Proxy
**Windows PowerShell:**
```powershell
# Test ISRU Leaderboard
Invoke-RestMethod -Uri "http://localhost:3000/api/universal-proxy?api=isru-leaderboard"

# Test SneakerDB Profile
Invoke-RestMethod -Uri "http://localhost:3000/api/universal-proxy?api=sneakerdb-profile&username=testuser"
```

**Bash/Linux/Mac:**
```bash
# Test ISRU Leaderboard
curl "http://localhost:3000/api/universal-proxy?api=isru-leaderboard"

# Test SneakerDB Profile  
curl "http://localhost:3000/api/universal-proxy?api=sneakerdb-profile&username=testuser"
```

## Vantaggi del Proxy Proprietario

✅ **Velocità**: Nessun hop intermedio, chiamata diretta  
✅ **Affidabilità**: Non dipende da servizi terzi  
✅ **Controllo**: Gestione completa di cache, timeout, retry  
✅ **Monitoraggio**: Log dettagliati e metriche  
✅ **Sicurezza**: Controllo degli header e validazione  

## Configurazione Produzione

Il proxy è configurato per:
- **Timeout**: 10 secondi
- **Cache**: 1 minuto
- **CORS**: Permette tutte le origini
- **Retry**: Gestito dal frontend con fallback

## Monitoraggio

Vercel fornisce automaticamente:
- Logs delle funzioni
- Metriche di performance
- Error tracking
- Analytics
