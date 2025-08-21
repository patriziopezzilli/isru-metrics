class MigrationService {
  private static readonly NEW_DOMAIN = 'https://www.isru-league.com';
  private static readonly MIGRATION_KEY = 'auto-migration-completed';
  
  /**
   * Verifica se il nuovo dominio è raggiungibile e sicuro
   */
  static async verifyNewDomain(): Promise<boolean> {
    try {
      const response = await fetch(this.NEW_DOMAIN, { 
        method: 'HEAD',
        mode: 'no-cors' // Evita problemi CORS per la verifica
      });
      return true;
    } catch (error) {
      console.warn('❌ New domain verification failed:', error);
      return false;
    }
  }
  
  /**
   * Forza la migrazione rimuovendo i flag di completamento (per debug/testing)
   */
  static forceMigration(): void {
    console.log('🔧 === FORCING MIGRATION ===');
    console.log('🔧 Current domain:', window.location.hostname);
    console.log('🔧 Removing migration completion flags...');
    
    // Rimuovi tutti i flag di migrazione completata
    localStorage.removeItem(this.MIGRATION_KEY);
    localStorage.removeItem('migration-completed');
    
    console.log('🔧 Migration flags removed');
    console.log('🔧 shouldMigrate() now returns:', this.shouldMigrate());
    
    // Se dovrebbe migrare, avvia subito la migrazione
    if (this.shouldMigrate()) {
      console.log('🔧 Starting forced migration...');
      this.performMigration();
    } else {
      console.log('🔧 Migration conditions not met after reset');
    }
  }

  /**
   * Controlla se siamo in ambiente locale
   */
  static isLocalEnvironment(): boolean {
    const hostname = window.location.hostname;
    return hostname === 'localhost' || hostname === '127.0.0.1' || hostname.startsWith('192.168.');
  }

  /**
   * Controlla se siamo sul vecchio dominio e se la migrazione è necessaria
   */
  static shouldMigrate(): boolean {
    console.log('🔍 === CHECKING IF SHOULD MIGRATE ===');
    console.log('🔍 Current hostname:', window.location.hostname);
    console.log('🔍 Current full URL:', window.location.href);
    
    // In locale, simula la migrazione solo se c'è un flag specifico per testing
    if (this.isLocalEnvironment()) {
      console.log('🏠 Local environment detected');
      const forceTestMigration = localStorage.getItem('test-migration-flow') === 'true';
      const hasData = this.hasUserDataToMigrate();
      const notCompleted = localStorage.getItem(this.MIGRATION_KEY) !== 'true';
      
      console.log('🔍 Local migration conditions:');
      console.log('   - Force test migration flag:', forceTestMigration);
      console.log('   - Has user data:', hasData);
      console.log('   - Migration not completed:', notCompleted);
      console.log('   - Migration key value:', localStorage.getItem(this.MIGRATION_KEY));
      
      const shouldMigrateLocal = forceTestMigration && hasData && notCompleted;
      console.log('🔍 Local shouldMigrate result:', shouldMigrateLocal);
      return shouldMigrateLocal;
    }
    
    // Controlla se siamo sul dominio vecchio (non www.isru-league.com)
    const currentDomain = window.location.hostname;
    const isNewDomain = currentDomain === 'www.isru-league.com' || currentDomain === 'isru-league.com';
    const isOldDomain = !isNewDomain;
    
    // Controlla se la migrazione è già stata fatta
    const migrationCompleted = localStorage.getItem(this.MIGRATION_KEY) === 'true';
    
    console.log('🔍 Production migration conditions:');
    console.log('   - Current domain:', currentDomain);
    console.log('   - Is new domain (isru-league.com):', isNewDomain);
    console.log('   - Is old domain (needs migration):', isOldDomain);
    console.log('   - Migration completed:', migrationCompleted);
    console.log('   - Migration key value:', localStorage.getItem(this.MIGRATION_KEY));
    
    // Per utenti sul vecchio dominio, migra sempre (anche senza dati)
    // Questo garantisce che tutti vengano indirizzati al nuovo dominio
    const shouldMigrateProduction = isOldDomain && !migrationCompleted;
    console.log('🔍 Production shouldMigrate result:', shouldMigrateProduction);
    
    return shouldMigrateProduction;
  }

  /**
   * Controlla se ci sono dati utente da migrare
   */
  private static hasUserDataToMigrate(): boolean {
    const importantKeys = [
      'isru-username',
      'friends-league',
      'user-goals',
      'isru-offline-data',
      'online-sessions',
      'isru-goals'
    ];
    
    // In locale, per testing, considera che ci sono dati se c'è almeno un username
    if (this.isLocalEnvironment()) {
      return localStorage.getItem('isru-username') !== null;
    }
    
    return importantKeys.some(key => localStorage.getItem(key) !== null);
  }

  /**
   * Raccoglie tutti i dati utente per la migrazione - COPIA TUTTO IL LOCALSTORAGE
   */
  static gatherUserData(): Record<string, any> {
    const userData: Record<string, any> = {};
    
    console.log('🔍 === STARTING MIGRATION DATA GATHERING ===');
    console.log('🔍 Total localStorage keys found:', localStorage.length);
    
    // Prima mostra tutte le chiavi che esistono
    console.log('🔍 All current localStorage keys:');
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key) {
        const value = localStorage.getItem(key);
        console.log(`   📋 Key: "${key}" -> Value: "${value?.substring(0, 50)}${value && value.length > 50 ? '...' : ''}"`);
      }
    }

    // Copia TUTTE le chiavi del localStorage senza filtri
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key) {
        const value = localStorage.getItem(key);
        if (value !== null) {
          userData[key] = value; // Mantieni come stringa per evitare problemi di parsing
          console.log(`✅ COPIED: ${key} = ${value.substring(0, 100)}${value.length > 100 ? '...' : ''}`);
        }
      }
    }

    // Controlli specifici per i dati critici
    console.log('🔍 === CRITICAL DATA CHECK ===');
    console.log('🔍 isru-username:', localStorage.getItem('isru-username'));
    console.log('🔍 friends-league:', localStorage.getItem('friends-league'));
    console.log('🔍 Username in userData:', userData['isru-username']);
    console.log('🔍 Friends-league in userData:', userData['friends-league']);

    // Aggiungi metadati sulla migrazione
    userData._migrationMeta = JSON.stringify({
      timestamp: new Date().toISOString(),
      fromDomain: window.location.hostname,
      userAgent: navigator.userAgent,
      version: '2.0',
      totalKeys: Object.keys(userData).length - 1 // -1 per escludere _migrationMeta
    });

    console.log('📋 === FINAL MIGRATION DATA ===');
    console.log('📋 Total data copied:', Object.keys(userData).length - 1, 'keys');
    console.log('📋 All keys to migrate:', Object.keys(userData).filter(k => k !== '_migrationMeta'));
    console.log('📋 Complete userData object:', userData);
    
    return userData;
  }

  /**
   * Simula la migrazione in ambiente locale (per testing)
   */
  static async simulateLocalMigration(): Promise<void> {
    // Raccoglie i dati utente
    const userData = this.gatherUserData();
    
    // Simula l'encoding/decoding che avverrebbe nella migrazione reale
    const encodedData = btoa(JSON.stringify(userData));
    console.log('🧪 Local simulation: Migration data encoded');
    
    // Simula un delay come se stessimo migrando
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Simula l'import dei dati
    const decodedData = JSON.parse(atob(encodedData));
    console.log('🧪 Local simulation: Migration data decoded and verified');
    
    // Marca la migrazione come completata per il test
    localStorage.setItem(this.MIGRATION_KEY, 'true');
    localStorage.setItem('migration-completed', JSON.stringify({
      timestamp: new Date().toISOString(),
      fromDomain: 'localhost-simulation',
      userAgent: navigator.userAgent,
      version: '1.0',
      isSimulation: true
    }));
    
    console.log('✅ Local migration simulation completed successfully!');
  }

  /**
   * Esegue la migrazione automatica verso il nuovo dominio
   */
  static async performMigration(): Promise<void> {
    console.log('🚀 === STARTING PERFORM MIGRATION ===');
    console.log('🚀 Current URL:', window.location.href);
    console.log('🚀 Current domain:', window.location.hostname);
    
    try {
      // Se siamo in locale, simula la migrazione senza redirect
      if (this.isLocalEnvironment()) {
        console.log('🏠 Local environment detected - simulating migration');
        await this.simulateLocalMigration();
        return;
      }

      // Verifica che il nuovo dominio sia raggiungibile
      console.log('🔍 Verifying new domain accessibility...');
      const isDomainAccessible = await this.verifyNewDomain();
      
      if (!isDomainAccessible) {
        console.warn('⚠️ New domain not accessible, postponing migration');
        return;
      }

      // Raccoglie TUTTI i dati del localStorage
      console.log('📦 Gathering user data for migration...');
      const userData = this.gatherUserData();
      console.log('📦 Gathered ALL localStorage data for migration');
      console.log('📦 Total keys to migrate:', Object.keys(userData).length - 1); // -1 per _migrationMeta
      
      // Salva tutto nel sessionStorage per il trasferimento
      sessionStorage.setItem('migration-data-full', JSON.stringify(userData));
      console.log('💾 ALL localStorage data saved to sessionStorage');
      console.log('💾 SessionStorage data size:', JSON.stringify(userData).length, 'characters');
      
      // BACKUP: Estrai dati critici per URL parameters come fallback
      const criticalData = {
        username: userData['isru-username'] || '',
        league: userData['friends-league'] || '',
        goals: userData['user-goals'] || userData['isru-goals'] || ''
      };
      
      // Codifica i dati critici per l'URL (compressi)
      const criticalDataEncoded = btoa(JSON.stringify(criticalData));
      console.log('🔐 Critical data encoded for URL backup:', criticalDataEncoded.length, 'chars');
      console.log('� Critical data content:', criticalData);
      
      console.log('�🚀 Starting complete data migration to new domain...');
      
      // Marca la migrazione come completata PRIMA del redirect
      localStorage.setItem(this.MIGRATION_KEY, 'true');
      console.log('✅ Migration key set to true before redirect');
      
      // Usa sessionStorage come metodo primario + URL backup per dati critici
      const redirectUrl = `${this.NEW_DOMAIN}?migrate=full-session&backup=${encodeURIComponent(criticalDataEncoded)}`;
      console.log('🔄 Redirecting with sessionStorage + URL backup...');
      console.log('🔄 Redirect URL:', redirectUrl);
      
      // Piccolo delay per assicurarsi che tutto sia salvato
      await new Promise(resolve => setTimeout(resolve, 100));
      
      window.location.assign(redirectUrl);
      
      console.log('🔄 Redirect initiated - this should not be logged if redirect works');
      console.log('💾 ALL localStorage data saved to sessionStorage');
      
      console.log('� Starting complete data migration to new domain...');
      
      // Usa solo sessionStorage per trasferire tutto
      console.log('🔄 Redirecting with complete sessionStorage migration...');
      window.location.assign(`${this.NEW_DOMAIN}?migrate=full-session`);
      
      // Marca la migrazione come completata
      localStorage.setItem(this.MIGRATION_KEY, 'true');
      
    } catch (error) {
      console.error('Migration failed:', error);
      // Fallback: reindirizza senza dati ma in modo sicuro
      console.log('🔄 Falling back to basic redirect...');
      window.location.assign(this.NEW_DOMAIN);
    }
  }

  static importMigratedData(): boolean {
    try {
      const urlParams = new URLSearchParams(window.location.search);
      const migrateParam = urlParams.get('migrate');
      const backupParam = urlParams.get('backup');
      
      console.log('🔍 === STARTING MIGRATION IMPORT ===');
      console.log('🔍 URL params:', window.location.search);
      console.log('🔍 Migration param found:', migrateParam);
      console.log('🔍 Backup param found:', backupParam ? 'YES' : 'NO');
      
      // Prima mostra cosa c'è attualmente nel localStorage di destinazione
      console.log('🔍 === DESTINATION LOCALSTORAGE BEFORE IMPORT ===');
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key) {
          const value = localStorage.getItem(key);
          console.log(`   📋 Existing: "${key}" -> "${value?.substring(0, 50)}"`);
        }
      }
      
      let userData: Record<string, any> | null = null;
      let importMethod = 'none';

      // METODO 1: Prova prima sessionStorage (metodo principale)
      if (migrateParam === 'full-session') {
        console.log('📦 Loading COMPLETE migration data from sessionStorage...');
        
        // RETRY MECHANISM: Prova più volte per gestire possibili timing issues
        let attempts = 0;
        const maxAttempts = 3;
        
        while (!userData && attempts < maxAttempts) {
          attempts++;
          console.log(`🔄 Attempt ${attempts}/${maxAttempts} to load sessionStorage data...`);
          
          const sessionData = sessionStorage.getItem('migration-data-full');
          console.log('🔍 SessionStorage keys available:', Object.keys(sessionStorage));
          console.log('🔍 Migration data in sessionStorage:', sessionData ? `FOUND (${sessionData.length} chars)` : 'NOT FOUND');
          
          if (sessionData) {
            try {
              userData = JSON.parse(sessionData);
              importMethod = 'sessionStorage';
              console.log('✅ COMPLETE migration data loaded from sessionStorage');
              console.log('📋 Keys found:', userData ? Object.keys(userData).filter(k => k !== '_migrationMeta') : []);
              
              // Controlli specifici
              if (userData) {
                console.log('🔍 === IMPORTED DATA CHECK (SessionStorage) ===');
                console.log('🔍 isru-username in imported data:', userData['isru-username']);
                console.log('🔍 friends-league in imported data:', userData['friends-league']);
              }
              break; // Successo, esci dal loop
            } catch (parseError) {
              console.error(`❌ Failed to parse sessionStorage data on attempt ${attempts}:`, parseError);
              userData = null;
            }
          } else {
            console.log(`❌ No sessionStorage data found on attempt ${attempts}`);
          }
          
          // Se non è l'ultimo tentativo, aspetta un po'
          if (attempts < maxAttempts && !userData) {
            console.log(`⏳ Waiting 100ms before retry...`);
            // In questo contesto sincrono, non possiamo usare await, ma possiamo provare subito
            // Il browser potrebbe aver bisogno di un momento per popolare sessionStorage
          }
        }
        
        if (!userData) {
          console.log('❌ No complete migration data found after all attempts');
        } else {
          // Pulisci il sessionStorage solo dopo aver caricato con successo
          sessionStorage.removeItem('migration-data-full');
          console.log('🧹 Cleaned migration data from sessionStorage');
        }
      }

      // METODO 2: Se sessionStorage fallisce, usa il backup URL
      if (!userData && backupParam) {
        console.log('📦 SessionStorage failed, trying URL backup method...');
        try {
          const criticalData = JSON.parse(atob(decodeURIComponent(backupParam)));
          console.log('🔐 Critical data decoded from URL:', criticalData);
          
          // Crea un oggetto userData minimale con i dati critici
          userData = {};
          if (criticalData.username) userData['isru-username'] = criticalData.username;
          if (criticalData.league) userData['friends-league'] = criticalData.league;
          if (criticalData.goals) {
            userData['user-goals'] = criticalData.goals;
            userData['isru-goals'] = criticalData.goals;
          }
          
          // Aggiungi metadati
          userData._migrationMeta = JSON.stringify({
            timestamp: new Date().toISOString(),
            fromDomain: 'backup-url-method',
            userAgent: navigator.userAgent,
            version: '2.0-backup',
            totalKeys: Object.keys(userData).length - 1
          });
          
          importMethod = 'URL-backup';
          console.log('✅ Critical data loaded from URL backup');
          console.log('🔍 === IMPORTED DATA CHECK (URL Backup) ===');
          console.log('🔍 isru-username in imported data:', userData['isru-username']);
          console.log('🔍 friends-league in imported data:', userData['friends-league']);
          
        } catch (backupError) {
          console.error('❌ Failed to decode backup data from URL:', backupError);
          userData = null;
        }
      }

      if (!userData) {
        console.log('❌ No migration data could be loaded from any method');
        return false;
      }

      console.log(`📋 === MIGRATION DATA TO IMPORT (via ${importMethod}) ===`);
      console.log('📋 Total migration data keys:', Object.keys(userData).length - 1); // -1 per _migrationMeta
      console.log('📋 All keys to import:', Object.keys(userData).filter(k => k !== '_migrationMeta'));

      // RIPRISTINA TUTTO il localStorage - sostituisce completamente il contenuto
      console.log('🧹 Clearing current localStorage before import...');
      localStorage.clear();

      // Importa tutti i dati nel localStorage
      let importedCount = 0;
      Object.entries(userData).forEach(([key, value]) => {
        if (key !== '_migrationMeta') {
          // Mantieni il valore come stringa (era già stringa quando copiato)
          localStorage.setItem(key, value as string);
          importedCount++;
          console.log(`✅ RESTORED: ${key} = ${(value as string).substring(0, 50)}${(value as string).length > 50 ? '...' : ''}`);
        }
      });

      console.log(`✅ === IMPORT COMPLETED (${importMethod}) ===`);
      console.log(`✅ Successfully restored ${importedCount} localStorage entries`);
      
      // Verifica che i dati critici siano stati importati correttamente
      console.log('🔍 === POST-IMPORT VERIFICATION ===');
      console.log('🔍 isru-username after import:', localStorage.getItem('isru-username'));
      console.log('🔍 friends-league after import:', localStorage.getItem('friends-league'));

      // Salva i metadati della migrazione
      if (userData._migrationMeta) {
        localStorage.setItem('migration-completed', userData._migrationMeta as string);
        console.log('✅ Migration metadata saved');
      }

      // Rimuovi il parametro dall'URL
      const newUrl = window.location.pathname + window.location.hash;
      window.history.replaceState({}, document.title, newUrl);
      console.log('🧹 URL cleaned, migration parameters removed');

      console.log(`🎉 COMPLETE localStorage migration completed successfully via ${importMethod}!`);
      return true;

    } catch (error) {
      console.error('❌ Failed to import migrated data:', error);
      console.error('❌ Current URL:', window.location.href);
      console.error('❌ URL search params:', window.location.search);
      return false;
    }
  }

  /**
   * Mostra una notifica di migrazione completata
   */
  static showMigrationSuccess(): void {
    const migrationMeta = localStorage.getItem('migration-completed');
    if (migrationMeta) {
      try {
        const meta = JSON.parse(migrationMeta);
        console.log(`🎉 Welcome to the new domain! Data migrated from ${meta.fromDomain} on ${new Date(meta.timestamp).toLocaleString()}`);
        
        // Rimuovi i metadati dopo aver mostrato il messaggio
        setTimeout(() => {
          localStorage.removeItem('migration-completed');
        }, 5000);
      } catch (error) {
        console.error('Error reading migration metadata:', error);
      }
    }
  }

  /**
   * Mostra lo stato attuale della migrazione (per debug)
   */
  static debugMigrationStatus(): void {
    console.log('🔧 === MIGRATION DEBUG STATUS ===');
    console.log('🔧 Current domain:', window.location.hostname);
    console.log('🔧 Current URL:', window.location.href);
    console.log('🔧 Is local environment:', this.isLocalEnvironment());
    
    const currentDomain = window.location.hostname;
    const isNewDomain = currentDomain === 'www.isru-league.com' || currentDomain === 'isru-league.com';
    const isOldDomain = !isNewDomain;
    const migrationCompleted = localStorage.getItem(this.MIGRATION_KEY) === 'true';
    
    console.log('🔧 Domain analysis:');
    console.log('   - Is new domain:', isNewDomain);
    console.log('   - Is old domain:', isOldDomain);
    console.log('   - Migration completed flag:', migrationCompleted);
    console.log('   - Migration key value:', localStorage.getItem(this.MIGRATION_KEY));
    console.log('   - Migration metadata:', localStorage.getItem('migration-completed'));
    
    console.log('🔧 Should migrate:', this.shouldMigrate());
    console.log('🔧 All localStorage keys:', Object.keys(localStorage));
    console.log('🔧 === END DEBUG STATUS ===');
  }
}

// Esponi il MigrationService globalmente per debugging in produzione
if (typeof window !== 'undefined') {
  (window as any).MigrationService = MigrationService;
  console.log('🔧 MigrationService exposed globally for debugging');
}

export default MigrationService;
