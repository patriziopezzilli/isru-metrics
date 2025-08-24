# 🗄️ ISRU Metrics Database System

Sistema completo di migrazione dal localStorage al database PostgreSQL per l'applicazione ISRU Metrics.

## 📋 Panoramica

Questo sistema fornisce:
- **Schema PostgreSQL completo** con 10 tabelle relazionali
- **Servizi di migrazione** dal localStorage al database
- **Stored procedures** per migrazione automatica dei dati
- **Setup Docker** per sviluppo rapido
- **API endpoints** per operazioni CRUD

## 🏗️ Architettura Database

### Tabelle Principali

```
users                     - Gestione utenti
├── user_sessions         - Sessioni e autenticazione
├── user_goals           - Obiettivi utente
├── goal_progress_history - Storico progressi
├── leagues              - Leghe/gruppi
├── league_memberships   - Appartenenze alle leghe
├── api_cache            - Cache delle chiamate API
├── activity_streaks     - Streak di attività
├── user_app_preferences - Preferenze applicazione
└── audit_log           - Log di audit
```

### Funzionalità Avanzate

- **Triggers automatici** per aggiornamento timestamp
- **Views ottimizzate** per query frequenti
- **Indici compositi** per performance
- **Stored procedures** per migrazione
- **Funzioni utility** per export/import

## 🚀 Quick Start

### 1. Setup con Docker (Raccomandato)

```bash
# Clona e naviga nel progetto
cd isru-metrics

# Copia configurazione
cp .env.example .env

# Avvia il database
docker-compose up -d postgres

# Verifica che sia funzionante
docker-compose logs postgres
```

Il database sarà disponibile su:
- **Host**: localhost
- **Port**: 5432
- **Database**: isru_metrics
- **User**: postgres
- **Password**: postgres_dev_password

### 2. Setup Manuale PostgreSQL

```bash
# Installa PostgreSQL
# Su Ubuntu/Debian:
sudo apt install postgresql postgresql-contrib

# Su macOS con Homebrew:
brew install postgresql

# Su Windows:
# Scarica da https://www.postgresql.org/download/windows/

# Crea database
sudo -u postgres createdb isru_metrics

# Importa schema
psql -U postgres -d isru_metrics -f database/schema.sql
psql -U postgres -d isru_metrics -f database/migration.sql
```

### 3. Configurazione Applicazione

```typescript
// In src/App.tsx o index.tsx
import { createDatabaseService } from './services/databaseService';
import { createDatabaseMigrationService } from './services/databaseMigrationService';

// Inizializza servizi
const dbService = createDatabaseService();
const migrationService = createDatabaseMigrationService(dbService);

// Test connessione
await dbService.testConnection();
```

## 📦 Migrazione localStorage → Database

### Migrazione Automatica

```typescript
import { createDatabaseMigrationService } from './services/databaseMigrationService';

const migrationService = createDatabaseMigrationService(dbService);

// Verifica cosa può essere migrato
const { canMigrate, dataFound } = migrationService.canMigrate();
console.log('Can migrate:', canMigrate);
console.log('Data found:', dataFound);

// Esegui migrazione completa
const result = await migrationService.migrateAllLocalStorageData({
    createBackupFile: true,           // Crea backup JSON
    clearLocalStorageAfterMigration: false, // Mantieni localStorage per ora
    onProgress: (progress) => {
        console.log(`${progress.progress}/${progress.total}: ${progress.message}`);
    }
});

console.log('Migration result:', result);
```

### Migrazione Manuale per Step

```typescript
// 1. Migra solo utente
const userId = await migrationService.migrateUser('username', 'displayName');

// 2. Migra goals
const goalsCount = await migrationService.migrateGoals(userId, goalsArray);

// 3. Migra progress history
const progressCount = await migrationService.migrateProgress(userId, progressArray);

// 4. Migra friends league
const leagueId = await migrationService.migrateFriendsLeague(userId, friendsArray);
```

## 📊 Esempi di Utilizzo

### Connessione e Query Base

```typescript
import { DatabaseService } from './services/databaseService';

const dbService = new DatabaseService({
    host: 'localhost',
    port: 5432,
    database: 'isru_metrics',
    user: 'postgres',
    password: 'your_password'
});

// Test connessione
const isConnected = await dbService.testConnection();

// Query utente
const user = await dbService.findUserByUsername('patriziopezzilli');

// Export completo dati utente
const userData = await dbService.exportUserData(userId);
```

### Migrazione Completa con Monitoraggio

```typescript
// Esempio completo di migrazione
async function performMigration() {
    const dbService = createDatabaseService();
    const migrationService = createDatabaseMigrationService(dbService);
    
    // Verifica prerequisiti
    if (!await migrationService.isDatabaseReady()) {
        throw new Error('Database not ready');
    }
    
    // Status check
    const status = migrationService.getMigrationStatus();
    if (!status.canMigrate) {
        console.log('Nothing to migrate');
        return;
    }
    
    // Test migrazione (dry run)
    const testResult = await migrationService.testMigration();
    console.log('Test result:', testResult);
    
    // Migrazione reale
    const result = await migrationService.migrateAllLocalStorageData({
        createBackupFile: true,
        clearLocalStorageAfterMigration: true,
        onProgress: (progress) => {
            // Aggiorna UI di progresso
            updateProgressBar(progress.progress, progress.total);
            showMessage(progress.message);
        }
    });
    
    if (result.success) {
        console.log('✅ Migration completed!');
        console.log('User ID:', result.user_id);
        console.log('Goals migrated:', result.goals_migrated);
        console.log('Progress records:', result.progress_records_migrated);
    } else {
        console.error('❌ Migration failed:', result.error);
    }
}
```

## 🔧 Stored Procedures Disponibili

### Migrazione

```sql
-- Migrazione completa da JSON
SELECT migrate_complete_localstorage_data('{
    "username": "patriziopezzilli",
    "goals": [...],
    "progressHistory": [...],
    "friendsLeague": [...]
}'::jsonb);

-- Migrazione singoli componenti
SELECT migrate_user_from_localstorage('username', 'display_name');
SELECT migrate_goals_from_localstorage(user_id, goals_json);
SELECT migrate_progress_from_localstorage(user_id, progress_json);
SELECT migrate_friends_league_from_localstorage(user_id, friends_json);
```

### Export e Backup

```sql
-- Export completo dati utente
SELECT export_user_data(user_id);

-- Statistiche utente
SELECT * FROM user_stats_view WHERE user_id = 1;

-- Leaderboard lega
SELECT * FROM league_leaderboard_view WHERE league_id = 1;
```

## 🌐 Deploy e Produzione

### Variabili d'Ambiente

```bash
# Database
DB_HOST=your-prod-db-host
DB_PORT=5432
DB_NAME=isru_metrics_prod
DB_USER=your_user
DB_PASSWORD=your_secure_password
DB_SSL=true

# Pool settings
DB_POOL_MAX=50
DB_IDLE_TIMEOUT=30000
```

### Deploy con Vercel + Neon/Supabase

```bash
# Installa dependencies
npm install pg @types/pg

# Configura DATABASE_URL in Vercel
DATABASE_URL=postgresql://user:password@host:5432/database?sslmode=require

# Deploy
vercel --prod
```

### Deploy con Heroku

```bash
# Aggiungi Heroku Postgres
heroku addons:create heroku-postgresql:hobby-dev

# Deploy schema
heroku pg:psql < database/schema.sql
heroku pg:psql < database/migration.sql

# Deploy app
git push heroku main
```

## 📈 Monitoraggio e Performance

### Indici Creati

```sql
-- Performance indexes già inclusi nello schema
users_username_idx          -- Ricerca per username
user_goals_user_id_idx      -- Goals per utente
progress_history_goal_idx   -- Progress per goal
league_memberships_idx      -- Memberships per lega
api_cache_key_idx          -- Cache lookup
activity_streaks_user_idx   -- Streaks per utente
```

### Query di Monitoraggio

```sql
-- Connessioni attive
SELECT count(*) FROM pg_stat_activity WHERE state = 'active';

-- Dimensione database
SELECT pg_size_pretty(pg_database_size('isru_metrics'));

-- Top queries lente
SELECT query, mean_time, calls FROM pg_stat_statements 
ORDER BY mean_time DESC LIMIT 10;
```

## 🔍 Troubleshooting

### Problemi Comuni

**Database non raggiungibile**
```bash
# Verifica che PostgreSQL sia in esecuzione
sudo service postgresql status
# oppure
docker-compose ps postgres
```

**Errori di migrazione**
```typescript
// Abilita debug logging
const dbService = createDatabaseService({
    // ... config
});

// Test step by step
const testResult = await migrationService.testMigration();
console.log('Test details:', testResult.details);
```

**Performance lente**
```sql
-- Analizza query
EXPLAIN ANALYZE SELECT * FROM user_goals WHERE user_id = 1;

-- Rigenera statistiche
ANALYZE;
```

### Log e Debug

```typescript
// Abilita logging dettagliato
const dbService = new DatabaseService(config);

// Pool stats
console.log('Pool stats:', dbService.getPoolStats());

// System info
const sysInfo = await dbService.getSystemInfo();
console.log('Database info:', sysInfo);
```

## 📝 Prossimi Passi

1. **Test** il sistema con i tuoi dati localStorage
2. **Configura** le variabili d'ambiente
3. **Esegui** la migrazione in ambiente di test
4. **Deploy** in produzione
5. **Monitora** le performance

Per domande o problemi, consulta la documentazione delle singole funzioni nei file sorgente.
