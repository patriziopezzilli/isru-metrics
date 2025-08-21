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
    // In locale, simula la migrazione solo se c'è un flag specifico per testing
    if (this.isLocalEnvironment()) {
      const forceTestMigration = localStorage.getItem('test-migration-flow') === 'true';
      const hasData = this.hasUserDataToMigrate();
      const notCompleted = localStorage.getItem(this.MIGRATION_KEY) !== 'true';
      return forceTestMigration && hasData && notCompleted;
    }
    
    // Controlla se siamo sul dominio vecchio (non www.isru-league.com)
    const currentDomain = window.location.hostname;
    const isOldDomain = !currentDomain.includes('isru-league.com');
    
    // Controlla se la migrazione è già stata fatta
    const migrationCompleted = localStorage.getItem(this.MIGRATION_KEY) === 'true';
    
    // Per utenti sul vecchio dominio, migra sempre (anche senza dati)
    // Questo garantisce che tutti vengano indirizzati al nuovo dominio
    return isOldDomain && !migrationCompleted;
  }

  /**
   * Controlla se ci sono dati utente da migrare
   */
  private static hasUserDataToMigrate(): boolean {
    const importantKeys = [
      'isru-username',
      'friends-league',
      'user-goals',
      'online-sessions',
      'offline-data'
    ];
    
    // In locale, per testing, considera che ci sono dati se c'è almeno un username
    if (this.isLocalEnvironment()) {
      return localStorage.getItem('isru-username') !== null;
    }
    
    return importantKeys.some(key => localStorage.getItem(key) !== null);
  }

  /**
   * Raccoglie tutti i dati utente per la migrazione
   */
  static gatherUserData(): Record<string, any> {
    const userData: Record<string, any> = {};
    
    // Lista di tutte le chiavi che vogliamo migrare
    const keysToMigrate = [
      'isru-username',
      'friends-league',
      'user-goals',
      'offline-data',
      'online-sessions',
      'online-stats',
      'goal-tracker-data',
      'domain-migration-warning-dismissed',
      // Aggiungi altre chiavi se necessario
    ];

    console.log('🔍 Checking localStorage for migration data...');
    console.log('🔍 All localStorage keys:', Object.keys(localStorage));

    keysToMigrate.forEach(key => {
      const value = localStorage.getItem(key);
      if (value !== null) {
        try {
          // Prova a parsare come JSON, se fallisce mantieni come stringa
          userData[key] = JSON.parse(value);
          console.log(`✅ Found data for ${key}:`, typeof userData[key], userData[key]);
        } catch {
          userData[key] = value;
          console.log(`✅ Found string data for ${key}:`, value);
        }
      } else {
        console.log(`❌ No data found for ${key}`);
      }
    });

    // Aggiungi metadati sulla migrazione
    userData._migrationMeta = {
      timestamp: new Date().toISOString(),
      fromDomain: window.location.hostname,
      userAgent: navigator.userAgent,
      version: '1.0'
    };

    console.log('📋 Final userData object:', userData);
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

      // Raccoglie i dati utente
      const userData = this.gatherUserData();
      console.log('📦 Gathered user data for migration:', userData);
      console.log('📦 Data keys to migrate:', Object.keys(userData));
      
      // Usa sempre sessionStorage come metodo più affidabile
      sessionStorage.setItem('migration-data', JSON.stringify(userData));
      console.log('💾 Migration data saved to sessionStorage');
      
      // Codifica i dati in Base64 per l'URL come backup
      const encodedData = btoa(JSON.stringify(userData));
      console.log('🔐 Data encoded successfully, length:', encodedData.length);
      
      console.log('🚀 Starting secure migration to new domain...');
      
      // Usa sessionStorage come metodo primario, URL come backup
      try {
        // Prima prova con sessionStorage
        console.log('🔄 Redirecting with sessionStorage method...');
        window.location.assign(`${this.NEW_DOMAIN}?migrate=session&backup=${encodeURIComponent(encodedData.substring(0, 1000))}`);
      } catch (error) {
        console.warn('⚠️ SessionStorage redirect failed, trying URL method:', error);
        // Fallback al metodo URL
        if (encodedData.length > 8000) {
          console.warn('User data too large for URL migration, using sessionStorage only');
          window.location.assign(`${this.NEW_DOMAIN}?migrate=session`);
        } else {
          window.location.assign(`${this.NEW_DOMAIN}?migrate=${encodedData}`);
        }
      }
      
      // Marca la migrazione come completata
      localStorage.setItem(this.MIGRATION_KEY, 'true');
      
    } catch (error) {
      console.error('Migration failed:', error);
      // Fallback: reindirizza senza dati ma in modo sicuro
      console.log('🔄 Falling back to basic redirect...');
      window.location.assign(this.NEW_DOMAIN);
    }
  }

  /**
   * Importa i dati sul nuovo dominio
   */
  static importMigratedData(): boolean {
    try {
      const urlParams = new URLSearchParams(window.location.search);
      const migrateParam = urlParams.get('migrate');
      const backupParam = urlParams.get('backup');
      
      console.log('🔍 Migration check - URL params:', window.location.search);
      console.log('🔍 Migration param found:', migrateParam);
      console.log('🔍 Backup param found:', backupParam ? 'Yes' : 'No');
      
      let userData: Record<string, any> | null = null;

      // Prova prima sessionStorage
      if (migrateParam === 'session') {
        console.log('📦 Loading migration data from sessionStorage...');
        const sessionData = sessionStorage.getItem('migration-data');
        if (sessionData) {
          userData = JSON.parse(sessionData);
          sessionStorage.removeItem('migration-data');
          console.log('✅ Migration data loaded from sessionStorage');
        } else {
          console.log('❌ No migration data found in sessionStorage');
        }
      }
      
      // Se sessionStorage fallisce, prova l'URL
      if (!userData && migrateParam && migrateParam !== 'session') {
        console.log('📦 Decoding migration data from URL...');
        try {
          userData = JSON.parse(atob(migrateParam));
          console.log('✅ Migration data decoded from URL');
        } catch (error) {
          console.log('❌ Failed to decode from URL:', error);
        }
      }
      
      // Se tutto fallisce, prova il backup
      if (!userData && backupParam) {
        console.log('📦 Trying backup data from URL...');
        try {
          userData = JSON.parse(atob(decodeURIComponent(backupParam)));
          console.log('✅ Migration data loaded from backup');
        } catch (error) {
          console.log('❌ Failed to decode backup data:', error);
        }
      }

      if (!userData) {
        console.log('❌ No migration data could be loaded from any source');
        return false;
      }

      console.log('📋 Migration data keys found:', Object.keys(userData));
      console.log('📋 Migration data:', userData);

      // Importa tutti i dati nel localStorage
      let importedCount = 0;
      Object.entries(userData).forEach(([key, value]) => {
        if (key !== '_migrationMeta') {
          const stringValue = typeof value === 'string' ? value : JSON.stringify(value);
          localStorage.setItem(key, stringValue);
          importedCount++;
          console.log(`✅ Imported: ${key} = ${stringValue.substring(0, 100)}${stringValue.length > 100 ? '...' : ''}`);
        }
      });

      console.log(`✅ Successfully imported ${importedCount} data entries`);

      // Salva i metadati della migrazione
      if (userData._migrationMeta) {
        localStorage.setItem('migration-completed', JSON.stringify(userData._migrationMeta));
        console.log('✅ Migration metadata saved');
      }

      // Rimuovi il parametro dall'URL
      const newUrl = window.location.pathname + window.location.hash;
      window.history.replaceState({}, document.title, newUrl);
      console.log('🧹 URL cleaned, migration parameters removed');

      console.log('🎉 Migration completed successfully!');
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
}

export default MigrationService;
