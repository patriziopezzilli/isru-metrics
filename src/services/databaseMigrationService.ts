// =====================================================
// DATABASE MIGRATION SERVICE - LocalStorage to Database Migration
// Servizio per migrare i dati dal localStorage al database PostgreSQL
// =====================================================

import { DatabaseService, MigrationData, MigrationResult } from './databaseService';

// =====================================================
// TIPI E INTERFACCE
// =====================================================

export interface LocalStorageData {
    username?: string;
    'friends-league'?: any[];
    [key: string]: any; // Per altri dati del localStorage
}

export interface MigrationProgress {
    step: string;
    progress: number;
    total: number;
    message: string;
    completed: boolean;
    error?: string;
}

export interface MigrationOptions {
    clearLocalStorageAfterMigration?: boolean;
    createBackupFile?: boolean;
    onProgress?: (progress: MigrationProgress) => void;
}

// =====================================================
// DATABASE MIGRATION SERVICE CLASS
// =====================================================

export class DatabaseMigrationService {
    private databaseService: DatabaseService;
    private migrationInProgress: boolean = false;

    constructor(databaseService: DatabaseService) {
        this.databaseService = databaseService;
    }

    // =====================================================
    // METODI PRINCIPALI DI MIGRAZIONE
    // =====================================================

    /**
     * Migra tutti i dati dal localStorage al database
     */
    async migrateAllLocalStorageData(options: MigrationOptions = {}): Promise<MigrationResult> {
        if (this.migrationInProgress) {
            throw new Error('Migration already in progress');
        }

        this.migrationInProgress = true;
        
        try {
            // Step 1: Raccogli tutti i dati dal localStorage
            this.reportProgress(options, 'collecting', 1, 5, 'Collecting localStorage data...');
            const localStorageData = this.collectLocalStorageData();

            if (!localStorageData.username) {
                throw new Error('No username found in localStorage. Cannot proceed with migration.');
            }

            // Step 2: Prepara i dati per la migrazione
            this.reportProgress(options, 'preparing', 2, 5, 'Preparing migration data...');
            const migrationData = this.prepareMigrationData(localStorageData);

            // Step 3: Crea backup se richiesto
            if (options.createBackupFile) {
                this.reportProgress(options, 'backup', 3, 5, 'Creating backup file...');
                await this.createBackupFile(localStorageData);
            }

            // Step 4: Esegui la migrazione
            this.reportProgress(options, 'migrating', 4, 5, 'Migrating to database...');
            const migrationResult = await this.databaseService.migrateFromLocalStorage(migrationData);

            if (!migrationResult.success) {
                throw new Error(`Migration failed: ${migrationResult.error}`);
            }

            // Step 5: Pulizia localStorage se richiesta
            if (options.clearLocalStorageAfterMigration) {
                this.reportProgress(options, 'cleanup', 5, 5, 'Cleaning up localStorage...');
                this.clearMigratedLocalStorageData();
            }

            this.reportProgress(options, 'completed', 5, 5, 'Migration completed successfully!', true);
            
            return migrationResult;

        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown migration error';
            this.reportProgress(options, 'error', 0, 5, errorMessage, false, errorMessage);
            
            return {
                success: false,
                error: errorMessage
            };
        } finally {
            this.migrationInProgress = false;
        }
    }

    /**
     * Verifica se c'è qualcosa da migrare nel localStorage
     */
    canMigrate(): { canMigrate: boolean; reason?: string; dataFound: string[] } {
        const dataFound: string[] = [];
        
        // Controlla la presenza di dati rilevanti
        if (localStorage.getItem('isru-username')) {
            dataFound.push('username');
        }
        
        if (localStorage.getItem('friends-league')) {
            dataFound.push('friends-league');
        }

        // Cerca goals
        const goals = this.extractGoalsFromLocalStorage();
        if (goals.length > 0) {
            dataFound.push(`${goals.length} goals`);
        }

        // Cerca progress history
        const progress = this.extractProgressHistoryFromLocalStorage();
        if (progress.length > 0) {
            dataFound.push(`${progress.length} progress records`);
        }

        // Cerca altri dati dell'app
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key && (key.includes('isru') || key.includes('goal') || key.includes('cache'))) {
                if (!dataFound.includes(key)) {
                    dataFound.push(key);
                }
            }
        }

        const canMigrate = dataFound.length > 0 && dataFound.includes('username');
        const reason = !canMigrate ? 
            (dataFound.length === 0 ? 'No data found in localStorage' : 'Username not found') : 
            undefined;

        return { canMigrate, reason, dataFound };
    }

    // =====================================================
    // METODI DI RACCOLTA DATI
    // =====================================================

    /**
     * Raccoglie tutti i dati rilevanti dal localStorage
     */
    private collectLocalStorageData(): LocalStorageData {
        const data: LocalStorageData = {};

        // Username
        const username = localStorage.getItem('isru-username');
        if (username) {
            data.username = username;
        }

        // Friends League
        const friendsLeague = localStorage.getItem('friends-league');
        if (friendsLeague) {
            try {
                data['friends-league'] = JSON.parse(friendsLeague);
            } catch (error) {
                console.warn('Failed to parse friends-league data:', error);
            }
        }

        // Altri dati del localStorage che potrebbero essere rilevanti
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key && (key.includes('isru') || key.includes('goal') || key.includes('cache'))) {
                const value = localStorage.getItem(key);
                if (value) {
                    try {
                        data[key] = JSON.parse(value);
                    } catch {
                        data[key] = value; // Se non è JSON, mantieni come stringa
                    }
                }
            }
        }

        return data;
    }

    /**
     * Prepara i dati in formato adatto alla migrazione
     */
    private prepareMigrationData(localStorageData: LocalStorageData): MigrationData {
        const migrationData: MigrationData = {
            username: localStorageData.username!
        };

        // Goals
        const goals = this.extractGoalsFromLocalStorage();
        if (goals.length > 0) {
            migrationData.goals = goals;
        }

        // Progress History
        const progressHistory = this.extractProgressHistoryFromLocalStorage();
        if (progressHistory.length > 0) {
            migrationData.progressHistory = progressHistory;
        }

        // Friends League
        if (localStorageData['friends-league']) {
            migrationData.friendsLeague = localStorageData['friends-league'];
        }

        // Preferences e cache
        const preferences: any = {};
        const cache: any = {};

        Object.keys(localStorageData).forEach(key => {
            if (key.includes('preference') || key.includes('setting')) {
                preferences[key] = localStorageData[key];
            } else if (key.includes('cache')) {
                cache[key] = localStorageData[key];
            }
        });

        if (Object.keys(preferences).length > 0) {
            migrationData.preferences = preferences;
        }

        if (Object.keys(cache).length > 0) {
            migrationData.cache = cache;
        }

        return migrationData;
    }

    /**
     * Estrae i goals dal localStorage
     */
    private extractGoalsFromLocalStorage(): any[] {
        const goals: any[] = [];

        // Cerca goals nel goalService pattern
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key && key.includes('goal')) {
                const value = localStorage.getItem(key);
                if (value) {
                    try {
                        const goalData = JSON.parse(value);
                        // Se è un array di goals
                        if (Array.isArray(goalData)) {
                            goals.push(...goalData);
                        } 
                        // Se è un singolo goal
                        else if (goalData && typeof goalData === 'object') {
                            goals.push(goalData);
                        }
                    } catch (error) {
                        console.warn(`Failed to parse goal data from ${key}:`, error);
                    }
                }
            }
        }

        return goals;
    }

    /**
     * Estrae la progress history dal localStorage
     */
    private extractProgressHistoryFromLocalStorage(): any[] {
        const progressHistory: any[] = [];

        // Cerca progress history
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key && (key.includes('progress') || key.includes('history'))) {
                const value = localStorage.getItem(key);
                if (value) {
                    try {
                        const progressData = JSON.parse(value);
                        if (Array.isArray(progressData)) {
                            progressHistory.push(...progressData);
                        } else if (progressData && typeof progressData === 'object') {
                            progressHistory.push(progressData);
                        }
                    } catch (error) {
                        console.warn(`Failed to parse progress data from ${key}:`, error);
                    }
                }
            }
        }

        return progressHistory;
    }

    // =====================================================
    // METODI DI BACKUP E PULIZIA
    // =====================================================

    /**
     * Crea un file di backup del localStorage
     */
    private async createBackupFile(localStorageData: LocalStorageData): Promise<void> {
        const backupData = {
            backup_timestamp: new Date().toISOString(),
            backup_source: 'localStorage',
            data: localStorageData
        };

        const backupJson = JSON.stringify(backupData, null, 2);
        const backupFileName = `isru-metrics-backup-${Date.now()}.json`;

        // Crea un blob e scarica il file
        const blob = new Blob([backupJson], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        
        const link = document.createElement('a');
        link.href = url;
        link.download = backupFileName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        URL.revokeObjectURL(url);

        console.log(`✅ Backup file created: ${backupFileName}`);
    }

    /**
     * Pulisce i dati migrati dal localStorage
     */
    private clearMigratedLocalStorageData(): void {
        const keysToRemove: string[] = [];

        // Identifica le chiavi da rimuovere
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key && (
                key.includes('isru') || 
                key.includes('goal') || 
                key.includes('friends-league') ||
                key.includes('progress')
            )) {
                keysToRemove.push(key);
            }
        }

        // Rimuovi le chiavi
        keysToRemove.forEach(key => {
            localStorage.removeItem(key);
            console.log(`🗑️ Removed localStorage key: ${key}`);
        });

        console.log(`✅ Cleaned up ${keysToRemove.length} localStorage keys`);
    }

    // =====================================================
    // METODI DI UTILITÀ
    // =====================================================

    /**
     * Riporta il progresso della migrazione
     */
    private reportProgress(
        options: MigrationOptions,
        step: string,
        progress: number,
        total: number,
        message: string,
        completed: boolean = false,
        error?: string
    ): void {
        if (options.onProgress) {
            options.onProgress({
                step,
                progress,
                total,
                message,
                completed,
                error
            });
        }
        
        console.log(`📊 Migration Progress: ${progress}/${total} - ${message}`);
        if (error) {
            console.error(`❌ Migration Error: ${error}`);
        }
    }

    /**
     * Verifica se il database è connesso
     */
    async isDatabaseReady(): Promise<boolean> {
        return await this.databaseService.testConnection();
    }

    /**
     * Ottiene informazioni sullo stato della migrazione
     */
    getMigrationStatus(): { inProgress: boolean; canMigrate: boolean; dataFound: string[] } {
        const { canMigrate, dataFound } = this.canMigrate();
        
        return {
            inProgress: this.migrationInProgress,
            canMigrate,
            dataFound
        };
    }

    /**
     * Migrazione di test per validazione
     */
    async testMigration(): Promise<{ success: boolean; details: any }> {
        try {
            const localStorageData = this.collectLocalStorageData();
            const migrationData = this.prepareMigrationData(localStorageData);
            
            return {
                success: true,
                details: {
                    localStorage_data: localStorageData,
                    migration_data: migrationData,
                    database_ready: await this.isDatabaseReady()
                }
            };
        } catch (error) {
            return {
                success: false,
                details: {
                    error: error instanceof Error ? error.message : 'Unknown error'
                }
            };
        }
    }
}

// =====================================================
// FACTORY FUNCTION
// =====================================================

/**
 * Crea un'istanza del DatabaseMigrationService
 */
export function createDatabaseMigrationService(databaseService: DatabaseService): DatabaseMigrationService {
    return new DatabaseMigrationService(databaseService);
}

// =====================================================
// EXPORT DEFAULT
// =====================================================

export default DatabaseMigrationService;
