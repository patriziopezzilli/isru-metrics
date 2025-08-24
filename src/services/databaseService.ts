// =====================================================
// DATABASE SERVICE - PostgreSQL Connection & Migration
// Servizio per gestire la connessione al database e le migrazioni
// =====================================================

import { Pool, Client, QueryResult } from 'pg';

// =====================================================
// TIPI E INTERFACCE
// =====================================================

export interface DatabaseConfig {
    host: string;
    port: number;
    database: string;
    user: string;
    password: string;
    ssl?: boolean;
    max?: number;
    idleTimeoutMillis?: number;
    connectionTimeoutMillis?: number;
}

export interface MigrationData {
    username: string;
    displayName?: string;
    email?: string;
    goals?: any[];
    progressHistory?: any[];
    friendsLeague?: any[];
    preferences?: any;
    cache?: any;
    leagueName?: string;
}

export interface MigrationResult {
    success: boolean;
    user_id?: number;
    username?: string;
    goals_migrated?: number;
    progress_records_migrated?: number;
    league_id?: number;
    migration_timestamp?: string;
    error?: string;
    error_detail?: string;
}

export interface UserExportData {
    user: any;
    goals: any[];
    progress: any[];
    leagues: any[];
    preferences: any[];
    export_timestamp: string;
}

// =====================================================
// DATABASE SERVICE CLASS
// =====================================================

export class DatabaseService {
    private pool: Pool;
    private isConnected: boolean = false;

    constructor(config: DatabaseConfig) {
        this.pool = new Pool({
            host: config.host,
            port: config.port,
            database: config.database,
            user: config.user,
            password: config.password,
            ssl: config.ssl ? { rejectUnauthorized: false } : false,
            max: config.max || 20,
            idleTimeoutMillis: config.idleTimeoutMillis || 30000,
            connectionTimeoutMillis: config.connectionTimeoutMillis || 2000,
        });

        // Event handlers per la connessione
        this.pool.on('connect', () => {
            console.log('✅ Connected to PostgreSQL database');
            this.isConnected = true;
        });

        this.pool.on('error', (err) => {
            console.error('❌ Unexpected error on idle client', err);
            this.isConnected = false;
        });
    }

    // =====================================================
    // METODI DI CONNESSIONE
    // =====================================================

    async testConnection(): Promise<boolean> {
        try {
            const client = await this.pool.connect();
            const result = await client.query('SELECT NOW() as current_time');
            client.release();
            
            console.log('🔗 Database connection test successful:', result.rows[0].current_time);
            this.isConnected = true;
            return true;
        } catch (error) {
            console.error('❌ Database connection test failed:', error);
            this.isConnected = false;
            return false;
        }
    }

    async closeConnection(): Promise<void> {
        try {
            await this.pool.end();
            console.log('🔌 Database connection pool closed');
            this.isConnected = false;
        } catch (error) {
            console.error('❌ Error closing database connection:', error);
        }
    }

    getConnectionStatus(): boolean {
        return this.isConnected;
    }

    // =====================================================
    // METODI DI MIGRAZIONE
    // =====================================================

    /**
     * Migra tutti i dati dal localStorage al database
     */
    async migrateFromLocalStorage(migrationData: MigrationData): Promise<MigrationResult> {
        const client = await this.pool.connect();
        
        try {
            await client.query('BEGIN');

            console.log('🚀 Starting complete localStorage migration for user:', migrationData.username);

            const result = await client.query(
                'SELECT migrate_complete_localstorage_data($1) as result',
                [JSON.stringify(migrationData)]
            );

            const migrationResult: MigrationResult = result.rows[0].result;

            if (migrationResult.success) {
                await client.query('COMMIT');
                console.log('✅ Migration completed successfully:', migrationResult);
            } else {
                await client.query('ROLLBACK');
                console.error('❌ Migration failed:', migrationResult.error);
            }

            return migrationResult;

        } catch (error) {
            await client.query('ROLLBACK');
            console.error('❌ Migration error:', error);
            
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error',
                error_detail: 'MIGRATION_EXCEPTION'
            };
        } finally {
            client.release();
        }
    }

    /**
     * Migra solo l'utente dal localStorage
     */
    async migrateUser(username: string, displayName?: string, email?: string, preferences?: any): Promise<number | null> {
        const client = await this.pool.connect();
        
        try {
            console.log('👤 Migrating user:', username);

            const result = await client.query(
                'SELECT migrate_user_from_localstorage($1, $2, $3, $4) as user_id',
                [username, displayName, email, JSON.stringify(preferences || {})]
            );

            const userId = result.rows[0].user_id;
            console.log('✅ User migrated with ID:', userId);
            
            return userId;

        } catch (error) {
            console.error('❌ User migration error:', error);
            return null;
        } finally {
            client.release();
        }
    }

    /**
     * Migra i goals dal localStorage
     */
    async migrateGoals(userId: number, goals: any[]): Promise<number> {
        const client = await this.pool.connect();
        
        try {
            console.log('🎯 Migrating goals for user ID:', userId);

            const result = await client.query(
                'SELECT migrate_goals_from_localstorage($1, $2) as goals_count',
                [userId, JSON.stringify(goals)]
            );

            const goalsCount = result.rows[0].goals_count;
            console.log('✅ Goals migrated:', goalsCount);
            
            return goalsCount;

        } catch (error) {
            console.error('❌ Goals migration error:', error);
            return 0;
        } finally {
            client.release();
        }
    }

    /**
     * Migra la progress history dal localStorage
     */
    async migrateProgress(userId: number, progressHistory: any[]): Promise<number> {
        const client = await this.pool.connect();
        
        try {
            console.log('📈 Migrating progress history for user ID:', userId);

            const result = await client.query(
                'SELECT migrate_progress_from_localstorage($1, $2) as progress_count',
                [userId, JSON.stringify(progressHistory)]
            );

            const progressCount = result.rows[0].progress_count;
            console.log('✅ Progress records migrated:', progressCount);
            
            return progressCount;

        } catch (error) {
            console.error('❌ Progress migration error:', error);
            return 0;
        } finally {
            client.release();
        }
    }

    /**
     * Migra la friends league dal localStorage
     */
    async migrateFriendsLeague(userId: number, friendsLeague: any[], leagueName?: string): Promise<number | null> {
        const client = await this.pool.connect();
        
        try {
            console.log('👥 Migrating friends league for user ID:', userId);

            const result = await client.query(
                'SELECT migrate_friends_league_from_localstorage($1, $2, $3) as league_id',
                [userId, JSON.stringify(friendsLeague), leagueName || 'My Friends League']
            );

            const leagueId = result.rows[0].league_id;
            console.log('✅ Friends league migrated with ID:', leagueId);
            
            return leagueId;

        } catch (error) {
            console.error('❌ Friends league migration error:', error);
            return null;
        } finally {
            client.release();
        }
    }

    // =====================================================
    // METODI DI EXPORT E BACKUP
    // =====================================================

    /**
     * Esporta tutti i dati di un utente per backup
     */
    async exportUserData(userId: number): Promise<UserExportData | null> {
        const client = await this.pool.connect();
        
        try {
            console.log('📦 Exporting data for user ID:', userId);

            const result = await client.query(
                'SELECT export_user_data($1) as user_data',
                [userId]
            );

            const userData: UserExportData = result.rows[0].user_data;
            console.log('✅ User data exported successfully');
            
            return userData;

        } catch (error) {
            console.error('❌ Export error:', error);
            return null;
        } finally {
            client.release();
        }
    }

    /**
     * Cerca un utente per username
     */
    async findUserByUsername(username: string): Promise<any | null> {
        const client = await this.pool.connect();
        
        try {
            const result = await client.query(
                'SELECT * FROM users WHERE username = $1',
                [username]
            );

            return result.rows.length > 0 ? result.rows[0] : null;

        } catch (error) {
            console.error('❌ Error finding user:', error);
            return null;
        } finally {
            client.release();
        }
    }

    // =====================================================
    // METODI GENERICI DI QUERY
    // =====================================================

    /**
     * Esegue una query generica
     */
    async query(text: string, params?: any[]): Promise<QueryResult | null> {
        const client = await this.pool.connect();
        
        try {
            const result = await client.query(text, params);
            return result;
        } catch (error) {
            console.error('❌ Query error:', error);
            return null;
        } finally {
            client.release();
        }
    }

    /**
     * Esegue una transazione con più query
     */
    async transaction(queries: Array<{ text: string; params?: any[] }>): Promise<QueryResult[] | null> {
        const client = await this.pool.connect();
        
        try {
            await client.query('BEGIN');
            
            const results: QueryResult[] = [];
            for (const query of queries) {
                const result = await client.query(query.text, query.params);
                results.push(result);
            }
            
            await client.query('COMMIT');
            return results;

        } catch (error) {
            await client.query('ROLLBACK');
            console.error('❌ Transaction error:', error);
            return null;
        } finally {
            client.release();
        }
    }

    // =====================================================
    // METODI DI MONITORAGGIO
    // =====================================================

    /**
     * Ottiene statistiche sulla connessione al database
     */
    getPoolStats() {
        return {
            totalCount: this.pool.totalCount,
            idleCount: this.pool.idleCount,
            waitingCount: this.pool.waitingCount,
            isConnected: this.isConnected
        };
    }

    /**
     * Ottiene informazioni di sistema dal database
     */
    async getSystemInfo(): Promise<any> {
        const client = await this.pool.connect();
        
        try {
            const result = await client.query(`
                SELECT 
                    version() as postgres_version,
                    current_database() as database_name,
                    current_user as current_user,
                    inet_server_addr() as server_ip,
                    inet_server_port() as server_port,
                    NOW() as current_timestamp
            `);

            return result.rows[0];

        } catch (error) {
            console.error('❌ Error getting system info:', error);
            return null;
        } finally {
            client.release();
        }
    }
}

// =====================================================
// FACTORY FUNCTION
// =====================================================

/**
 * Crea un'istanza del DatabaseService con configurazione da variabili d'ambiente
 */
export function createDatabaseService(customConfig?: Partial<DatabaseConfig>): DatabaseService {
    const defaultConfig: DatabaseConfig = {
        host: process.env.DB_HOST || 'localhost',
        port: parseInt(process.env.DB_PORT || '5432'),
        database: process.env.DB_NAME || 'isru_metrics',
        user: process.env.DB_USER || 'postgres',
        password: process.env.DB_PASSWORD || '',
        ssl: process.env.DB_SSL === 'true',
        max: parseInt(process.env.DB_POOL_MAX || '20'),
        idleTimeoutMillis: parseInt(process.env.DB_IDLE_TIMEOUT || '30000'),
        connectionTimeoutMillis: parseInt(process.env.DB_CONNECTION_TIMEOUT || '2000'),
    };

    const config = { ...defaultConfig, ...customConfig };
    
    return new DatabaseService(config);
}

// =====================================================
// EXPORT DEFAULT
// =====================================================

export default DatabaseService;
