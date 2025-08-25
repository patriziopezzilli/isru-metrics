// =====================================================
// MONGODB CONFIGURATION
// Configurazione centralizzata per MongoDB Atlas
// =====================================================

// =====================================================
// ENVIRONMENT VARIABLES
// =====================================================

export const MONGODB_CONFIG = {
    // Connection
    CONNECTION_STRING: process.env.MONGODB_CONNECTION_STRING || '',
    DATABASE_NAME: process.env.MONGODB_DATABASE_NAME || 'isru_metrics',
    
    // Connection Pool
    MAX_POOL_SIZE: parseInt(process.env.MONGODB_MAX_POOL_SIZE || '10'),
    MIN_POOL_SIZE: parseInt(process.env.MONGODB_MIN_POOL_SIZE || '2'),
    MAX_IDLE_TIME_MS: parseInt(process.env.MONGODB_MAX_IDLE_TIME_MS || '30000'),
    
    // Timeouts
    SERVER_SELECTION_TIMEOUT_MS: parseInt(process.env.MONGODB_SERVER_SELECTION_TIMEOUT_MS || '30000'),
    SOCKET_TIMEOUT_MS: parseInt(process.env.MONGODB_SOCKET_TIMEOUT_MS || '45000'),
    CONNECT_TIMEOUT_MS: parseInt(process.env.MONGODB_CONNECT_TIMEOUT_MS || '30000'),
    
    // Retry Settings
    RETRY_WRITES: process.env.MONGODB_RETRY_WRITES !== 'false',
    RETRY_READS: process.env.MONGODB_RETRY_READS !== 'false',
};

// =====================================================
// VALIDATION
// =====================================================

export function validateMongoDBConfig() {
    const errors = [];
    
    if (!MONGODB_CONFIG.CONNECTION_STRING) {
        errors.push('MONGODB_CONNECTION_STRING is required');
    }
    
    if (!MONGODB_CONFIG.DATABASE_NAME) {
        errors.push('MONGODB_DATABASE_NAME is required');
    }
    
    // Validate connection string format
    if (MONGODB_CONFIG.CONNECTION_STRING && !MONGODB_CONFIG.CONNECTION_STRING.startsWith('mongodb')) {
        errors.push('MONGODB_CONNECTION_STRING must start with mongodb:// or mongodb+srv://');
    }
    
    return {
        isValid: errors.length === 0,
        errors
    };
}

// =====================================================
// FEATURE FLAGS
// =====================================================

export const MONGODB_FEATURES = {
    // Enable/disable MongoDB completely
    ENABLED: process.env.MONGODB_ENABLED !== 'false',
    
    // Graceful degradation when MongoDB is unavailable
    GRACEFUL_DEGRADATION: process.env.MONGODB_GRACEFUL_DEGRADATION !== 'false',
    
    // Enable detailed logging
    DEBUG_LOGGING: process.env.MONGODB_DEBUG_LOGGING === 'true',
    
    // Enable migration from Vercel Blob
    MIGRATION_ENABLED: process.env.MONGODB_MIGRATION_ENABLED !== 'false',
    
    // Auto-retry failed connections
    AUTO_RETRY: process.env.MONGODB_AUTO_RETRY !== 'false',
};

// =====================================================
// COLLECTION NAMES
// =====================================================

export const COLLECTIONS = {
    AUDIT_LOGS: 'audit_logs',
    AUDIT_STATS: 'audit_stats',
    MIGRATION_LOG: 'migration_log',
};

// =====================================================
// INDEXES CONFIGURATION
// =====================================================

export const INDEXES = {
    AUDIT_LOGS: [
        // Primary indexes
        { key: { audit_id: 1 }, unique: true, name: 'audit_id_unique' },
        { key: { created_at: -1 }, name: 'created_at_desc' },
        
        // User-based queries
        { key: { username_lower: 1, created_at: -1 }, name: 'user_timeline' },
        { key: { username_lower: 1, date_key: 1 }, name: 'user_date' },
        
        // Date-based queries
        { key: { date_key: 1, created_at: -1 }, name: 'date_timeline' },
        { key: { date_key: 1, username_lower: 1, created_at: -1 }, name: 'date_user_timeline' },
        
        // Text search
        { key: { username: 'text', url: 'text' }, name: 'text_search' },
        
        // TTL index for automatic cleanup (1 year retention)
        { 
            key: { created_at: 1 }, 
            expireAfterSeconds: 365 * 24 * 60 * 60,
            name: 'ttl_cleanup'
        }
    ]
};

// =====================================================
// VALIDATION SCHEMAS
// =====================================================

export const VALIDATION_SCHEMAS = {
    AUDIT_LOGS: {
        $jsonSchema: {
            bsonType: 'object',
            required: [
                'audit_id', 
                'timestamp', 
                'server_timestamp', 
                'url', 
                'user_agent', 
                'localStorage_data', 
                'localStorage_size', 
                'created_at', 
                'date_key'
            ],
            properties: {
                audit_id: {
                    bsonType: 'string',
                    pattern: '^[a-zA-Z0-9_]+_[0-9]+_[a-zA-Z0-9]+$',
                    description: 'Unique audit identifier'
                },
                timestamp: {
                    bsonType: 'date',
                    description: 'Client timestamp'
                },
                server_timestamp: {
                    bsonType: 'date',
                    description: 'Server timestamp'
                },
                username: {
                    bsonType: ['string', 'null'],
                    maxLength: 100,
                    description: 'Username if available'
                },
                url: {
                    bsonType: 'string',
                    description: 'URL where audit was triggered'
                },
                user_agent: {
                    bsonType: 'string',
                    description: 'Browser user agent'
                },
                localStorage_data: {
                    bsonType: 'object',
                    description: 'localStorage data object'
                },
                localStorage_size: {
                    bsonType: 'number',
                    minimum: 0,
                    description: 'Size of localStorage data in bytes'
                },
                date_key: {
                    bsonType: 'string',
                    pattern: '^[0-9]{4}-[0-9]{2}-[0-9]{2}$',
                    description: 'Date in YYYY-MM-DD format'
                }
            }
        }
    }
};

// =====================================================
// HELPER FUNCTIONS
// =====================================================

export function getMongoDBConnectionOptions() {
    return {
        maxPoolSize: MONGODB_CONFIG.MAX_POOL_SIZE,
        minPoolSize: MONGODB_CONFIG.MIN_POOL_SIZE,
        maxIdleTimeMS: MONGODB_CONFIG.MAX_IDLE_TIME_MS,
        serverSelectionTimeoutMS: MONGODB_CONFIG.SERVER_SELECTION_TIMEOUT_MS,
        socketTimeoutMS: MONGODB_CONFIG.SOCKET_TIMEOUT_MS,
        connectTimeoutMS: MONGODB_CONFIG.CONNECT_TIMEOUT_MS,
        retryWrites: MONGODB_CONFIG.RETRY_WRITES,
        retryReads: MONGODB_CONFIG.RETRY_READS,
    };
}

export function isMongoDBEnabled() {
    return MONGODB_FEATURES.ENABLED && MONGODB_CONFIG.CONNECTION_STRING;
}

export function shouldUseGracefulDegradation() {
    return MONGODB_FEATURES.GRACEFUL_DEGRADATION;
}

// =====================================================
// LOGGING HELPERS
// =====================================================

export function logMongoDBConfig() {
    if (MONGODB_FEATURES.DEBUG_LOGGING) {
        console.log('🔧 MongoDB Configuration:');
        console.log('  - Database:', MONGODB_CONFIG.DATABASE_NAME);
        console.log('  - Pool Size:', `${MONGODB_CONFIG.MIN_POOL_SIZE}-${MONGODB_CONFIG.MAX_POOL_SIZE}`);
        console.log('  - Timeouts:', {
            server: MONGODB_CONFIG.SERVER_SELECTION_TIMEOUT_MS,
            socket: MONGODB_CONFIG.SOCKET_TIMEOUT_MS,
            connect: MONGODB_CONFIG.CONNECT_TIMEOUT_MS
        });
        console.log('  - Features:', MONGODB_FEATURES);
    }
}

// =====================================================
// EXPORT DEFAULT CONFIG
// =====================================================

export default {
    MONGODB_CONFIG,
    MONGODB_FEATURES,
    COLLECTIONS,
    INDEXES,
    VALIDATION_SCHEMAS,
    validateMongoDBConfig,
    getMongoDBConnectionOptions,
    isMongoDBEnabled,
    shouldUseGracefulDegradation,
    logMongoDBConfig
};
