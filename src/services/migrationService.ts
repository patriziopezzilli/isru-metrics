class MigrationService {
  private static readonly NEW_DOMAIN = 'https://www.isru-league.com';
  private static readonly MIGRATION_KEY = 'auto-migration-completed';
  
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
    
    // Controlla se l'utente ha dati da migrare
    const hasUserData = this.hasUserDataToMigrate();
    
    return isOldDomain && !migrationCompleted && hasUserData;
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

    keysToMigrate.forEach(key => {
      const value = localStorage.getItem(key);
      if (value !== null) {
        try {
          // Prova a parsare come JSON, se fallisce mantieni come stringa
          userData[key] = JSON.parse(value);
        } catch {
          userData[key] = value;
        }
      }
    });

    // Aggiungi metadati sulla migrazione
    userData._migrationMeta = {
      timestamp: new Date().toISOString(),
      fromDomain: window.location.hostname,
      userAgent: navigator.userAgent,
      version: '1.0'
    };

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

      // Raccoglie i dati utente
      const userData = this.gatherUserData();
      
      // Codifica i dati in Base64 per l'URL
      const encodedData = btoa(JSON.stringify(userData));
      
      // Controlla se i dati non sono troppo lunghi per l'URL
      if (encodedData.length > 8000) {
        console.warn('User data too large for URL migration, using localStorage backup');
        // Fallback: salva in sessionStorage per il pickup
        sessionStorage.setItem('migration-data', JSON.stringify(userData));
        window.location.href = `${this.NEW_DOMAIN}?migrate=session`;
      } else {
        // Reindirizza con i dati nell'URL
        window.location.href = `${this.NEW_DOMAIN}?migrate=${encodedData}`;
      }
      
      // Marca la migrazione come completata
      localStorage.setItem(this.MIGRATION_KEY, 'true');
      
    } catch (error) {
      console.error('Migration failed:', error);
      // Fallback: reindirizza senza dati
      window.location.href = this.NEW_DOMAIN;
    }
  }

  /**
   * Importa i dati sul nuovo dominio
   */
  static importMigratedData(): boolean {
    try {
      const urlParams = new URLSearchParams(window.location.search);
      const migrateParam = urlParams.get('migrate');
      
      if (!migrateParam) return false;

      let userData: Record<string, any>;

      if (migrateParam === 'session') {
        // Dati da sessionStorage
        const sessionData = sessionStorage.getItem('migration-data');
        if (!sessionData) return false;
        userData = JSON.parse(sessionData);
        sessionStorage.removeItem('migration-data');
      } else {
        // Dati dall'URL
        userData = JSON.parse(atob(migrateParam));
      }

      // Importa tutti i dati nel localStorage
      Object.entries(userData).forEach(([key, value]) => {
        if (key !== '_migrationMeta') {
          const stringValue = typeof value === 'string' ? value : JSON.stringify(value);
          localStorage.setItem(key, stringValue);
        }
      });

      // Salva i metadati della migrazione
      if (userData._migrationMeta) {
        localStorage.setItem('migration-completed', JSON.stringify(userData._migrationMeta));
      }

      // Rimuovi il parametro dall'URL
      const newUrl = window.location.pathname + window.location.hash;
      window.history.replaceState({}, document.title, newUrl);

      console.log('✅ Migration completed successfully!');
      return true;

    } catch (error) {
      console.error('Failed to import migrated data:', error);
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
