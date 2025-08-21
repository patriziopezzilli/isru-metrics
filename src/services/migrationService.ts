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
        mode: 'no-cors'
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
    console.log('🔍 === CHECKING IF SHOULD MIGRATE ===');
    console.log('🔍 Current hostname:', window.location.hostname);
    
    // In locale, non migrare mai automaticamente
    if (this.isLocalEnvironment()) {
      return false;
    }
    
    // Controlla se siamo sul dominio vecchio
    const currentDomain = window.location.hostname;
    const isNewDomain = currentDomain === 'www.isru-league.com' || currentDomain === 'isru-league.com';
    const isOldDomain = !isNewDomain;
    
    // Migra solo se siamo sul vecchio dominio E abbiamo dati da migrare
    const hasUsername = localStorage.getItem('isru-username') !== null;
    
    console.log('🔍 Migration conditions:');
    console.log('   - Is old domain:', isOldDomain);
    console.log('   - Has username:', hasUsername);
    
    const shouldMigrate = isOldDomain;
    console.log('🔍 Should migrate:', shouldMigrate);
    
    return shouldMigrate;
  }

  /**
   * Esegue la migrazione automatica verso il nuovo dominio
   */
  static async performMigration(): Promise<void> {
    console.log('🚀 === STARTING PERFORM MIGRATION (USERNAME + FRIENDS LIST) ===');
    
    try {
      // Verifica accessibilità nuovo dominio
      const isDomainAccessible = await this.verifyNewDomain();
      if (!isDomainAccessible) {
        console.warn('⚠️ New domain not accessible, postponing migration');
        return;
      }

      // Raccogli dati critici
      const username = localStorage.getItem('isru-username');
      const friendsLeagueStr = localStorage.getItem('friends-league');
      
      console.log('📦 Migrating data:');
      console.log('   - Username:', username);
      console.log('   - Friends League raw:', friendsLeagueStr);
      
      if (!username) {
        console.warn('⚠️ No username found, performing redirect without migration data');
        window.location.assign(this.NEW_DOMAIN);
        return;
      }
      
      // Estrai solo gli username dalla friends-league
      let friendsUsernames: string[] = [];
      if (friendsLeagueStr) {
        try {
          const friendsArray = JSON.parse(friendsLeagueStr);
          if (Array.isArray(friendsArray)) {
            friendsUsernames = friendsArray
              .map((friend: any) => friend.username)
              .filter((username: string) => username && username.trim().length > 0);
            console.log('📦 Extracted friends usernames:', friendsUsernames);
          }
        } catch (error) {
          console.warn('⚠️ Failed to parse friends-league:', error);
        }
      }
      
      // Prepara parametri migrazione - USERNAME + LISTA FRIENDS
      const migrationParams = new URLSearchParams();
      migrationParams.set('migrate', 'true');
      migrationParams.set('username', encodeURIComponent(username));
      
      // Passa gli username degli amici come stringa separata da virgole
      if (friendsUsernames.length > 0) {
        const friendsString = friendsUsernames.join(',');
        migrationParams.set('friends', encodeURIComponent(friendsString));
        console.log('📦 Friends usernames for URL:', friendsString);
      }
      
      migrationParams.set('t', Date.now().toString());
      
      const redirectUrl = `${this.NEW_DOMAIN}?${migrationParams.toString()}`;
      
      console.log('🔄 Redirecting with migration data...');
      console.log('🔄 Redirect URL (username + friends):', redirectUrl);
      console.log('🔄 Friends will be restored from URL parameters');
      
      // Marca migrazione completata e redirect
      localStorage.setItem(this.MIGRATION_KEY, 'true');
      await new Promise(resolve => setTimeout(resolve, 100));
      
      console.log('🔄 Redirecting now...');
      window.location.assign(redirectUrl);
      
    } catch (error) {
      console.error('Migration failed:', error);
      window.location.assign(this.NEW_DOMAIN);
    }
  }

  /**
   * Importa i dati migrati dai parametri URL e ricostruisce la friends-league
   */
  static importMigratedData(): boolean {
    console.log('📥 === CHECKING FOR MIGRATION DATA ===');
    console.log('📥 URL params:', window.location.search);
    
    const urlParams = new URLSearchParams(window.location.search);
    const isMigration = urlParams.get('migrate') === 'true';
    const username = urlParams.get('username');
    const friendsParam = urlParams.get('friends');
    
    console.log('📥 Migration parameters:');
    console.log('   - Is migration:', isMigration);
    console.log('   - Username:', username);
    console.log('   - Friends param:', friendsParam);
    
    if (!isMigration || !username) {
      console.log('📥 No migration data found');
      return false;
    }
    
    try {
      console.log('📥 === IMPORTING MIGRATION DATA ===');
      
      // Importa username
      localStorage.setItem('isru-username', decodeURIComponent(username));
      console.log('✅ Username imported:', decodeURIComponent(username));
      
      // Ricostruisci friends-league se ci sono amici
      let friendsCount = 0;
      if (friendsParam) {
        try {
          const friendsString = decodeURIComponent(friendsParam);
          const friendsUsernames = friendsString.split(',').filter(u => u.trim().length > 0);
          console.log('📥 Restoring friends usernames:', friendsUsernames);
          
          if (friendsUsernames.length > 0) {
            // Ricostruisci la struttura friends-league
            const friendsArray = friendsUsernames.map(friendUsername => ({
              username: friendUsername.trim(),
              profileData: null,
              loading: false
            }));
            
            localStorage.setItem('friends-league', JSON.stringify(friendsArray));
            friendsCount = friendsArray.length;
            console.log('✅ Friends league reconstructed with', friendsCount, 'friends');
          }
          
        } catch (parseError) {
          console.error('❌ Failed to parse friends from URL params:', parseError);
        }
      }
      
      // Salva metadati migrazione
      localStorage.setItem('migration-completed', JSON.stringify({
        timestamp: new Date().toISOString(),
        fromDomain: 'migration-via-url-params',
        version: '4.0',
        importedData: {
          username: decodeURIComponent(username),
          friendsCount: friendsCount
        }
      }));
      
      // Pulisci URL
      const cleanUrl = window.location.origin + window.location.pathname;
      window.history.replaceState({}, document.title, cleanUrl);
      
      console.log('✅ Migration import completed successfully!');
      console.log('✅ User can now use the app with migrated username and', friendsCount, 'friends');
      
      return true;
      
    } catch (error) {
      console.error('❌ Migration import failed:', error);
      return false;
    }
  }

  /**
   * Mostra notifica migrazione completata
   */
  static showMigrationSuccess(): void {
    const migrationMeta = localStorage.getItem('migration-completed');
    if (migrationMeta) {
      try {
        const meta = JSON.parse(migrationMeta);
        console.log(`🎉 Welcome to the new domain! Data migrated on ${new Date(meta.timestamp).toLocaleString()}`);
        
        if (meta.importedData) {
          console.log('🎉 Imported data:', meta.importedData);
        }
        
        // Rimuovi metadati dopo 5 secondi
        setTimeout(() => {
          localStorage.removeItem('migration-completed');
        }, 5000);
      } catch (error) {
        console.error('Error reading migration metadata:', error);
      }
    }
  }

  /**
   * Debug status migrazione
   */
  static debugMigrationStatus(): void {
    console.log('🔧 === MIGRATION DEBUG STATUS ===');
    console.log('🔧 Current domain:', window.location.hostname);
    console.log('🔧 Current URL:', window.location.href);
    
    const hasUsername = localStorage.getItem('isru-username') !== null;
    const friendsLeagueStr = localStorage.getItem('friends-league');
    
    console.log('🔧 Has username:', hasUsername);
    console.log('🔧 Username value:', localStorage.getItem('isru-username'));
    console.log('🔧 Friends league raw:', friendsLeagueStr);
    
    // Analizza friends-league
    let friendsCount = 0;
    let friendsUsernames: string[] = [];
    if (friendsLeagueStr) {
      try {
        const friendsArray = JSON.parse(friendsLeagueStr);
        if (Array.isArray(friendsArray)) {
          friendsCount = friendsArray.length;
          friendsUsernames = friendsArray.map((f: any) => f.username).filter(Boolean);
        }
      } catch (e) {
        console.log('🔧 Failed to parse friends-league');
      }
    }
    
    console.log('🔧 Friends count:', friendsCount);
    console.log('🔧 Friends usernames:', friendsUsernames);
    console.log('🔧 Should migrate:', this.shouldMigrate());
    
    // Controlla parametri URL
    const urlParams = new URLSearchParams(window.location.search);
    console.log('🔧 URL migration params:');
    console.log('   - migrate:', urlParams.get('migrate'));
    console.log('   - username:', urlParams.get('username'));
    console.log('   - friends:', urlParams.get('friends'));
    
    // Controlla sessionStorage (legacy)
    const migrationFriends = sessionStorage.getItem('migration-friends');
    console.log('🔧 SessionStorage migration-friends:', migrationFriends ? 'PRESENT (legacy)' : 'NOT FOUND');
    
    console.log('🔧 === END DEBUG STATUS ===');
  }

  /**
   * Forza migrazione per testing
   */
  static forceMigration(): void {
    console.log('🔧 === FORCING MIGRATION ===');
    if (this.shouldMigrate()) {
      console.log('🔧 Starting forced migration...');
      this.performMigration();
    } else {
      console.log('🔧 Migration conditions not met');
    }
  }
}

// Esponi globalmente per debugging
if (typeof window !== 'undefined') {
  (window as any).MigrationService = MigrationService;
  console.log('🔧 MigrationService exposed globally for debugging');
}

export default MigrationService;
