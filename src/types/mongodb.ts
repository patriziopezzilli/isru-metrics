// =====================================================
// MONGODB TYPES AND INTERFACES
// Tipi e interfacce per MongoDB Atlas
// =====================================================

import { ObjectId } from 'mongodb';

// =====================================================
// AUDIT LOG TYPES
// =====================================================

export interface AuditLog {
  _id?: ObjectId;
  audit_id: string; // Unique identifier: "username_timestamp_random"
  timestamp: Date; // Client timestamp
  server_timestamp: Date; // Server timestamp
  username?: string;
  session_id?: string;
  url: string;
  user_agent: string;
  client_ip: string;
  app_version?: string;
  localStorage_data: Record<string, any>;
  localStorage_size: number;
  created_at: Date;
  
  // Indexed fields for fast queries
  date_key: string; // YYYY-MM-DD format for date-based queries
  username_lower?: string; // Lowercase username for case-insensitive search
  
  // Metadata
  metadata?: {
    source?: string;
    version?: string;
    migration_source?: 'vercel_blob' | 'direct';
    [key: string]: any;
  };
}

// =====================================================
// QUERY INTERFACES
// =====================================================

export interface AuditQueryOptions {
  username?: string;
  date_from?: Date;
  date_to?: Date;
  date_key?: string;
  limit?: number;
  skip?: number;
  sort?: Record<string, 1 | -1>;
}

export interface AuditListResponse {
  audits: AuditLog[];
  total: number;
  page: number;
  limit: number;
  has_more: boolean;
}

export interface AuditStatsResponse {
  total_audits: number;
  unique_users: number;
  date_range: {
    earliest: Date;
    latest: Date;
  };
  avg_localStorage_size: number;
  max_localStorage_size: number;
  top_users: Array<{
    username: string;
    audit_count: number;
  }>;
}

// =====================================================
// MONGODB CONNECTION CONFIG
// =====================================================

export interface MongoDBConfig {
  connection_string: string;
  database_name: string;
  options?: {
    maxPoolSize?: number;
    minPoolSize?: number;
    maxIdleTimeMS?: number;
    serverSelectionTimeoutMS?: number;
    socketTimeoutMS?: number;
    connectTimeoutMS?: number;
    retryWrites?: boolean;
    retryReads?: boolean;
  };
}

// =====================================================
// COLLECTION NAMES
// =====================================================

export const COLLECTIONS = {
  AUDIT_LOGS: 'audit_logs',
  AUDIT_STATS: 'audit_stats', // For aggregated statistics
} as const;

// =====================================================
// INDEXES CONFIGURATION
// =====================================================

export const INDEXES = {
  AUDIT_LOGS: [
    // Primary indexes for common queries
    { key: { audit_id: 1 }, unique: true },
    { key: { username_lower: 1, created_at: -1 } },
    { key: { date_key: 1, created_at: -1 } },
    { key: { created_at: -1 } },
    
    // Compound indexes for complex queries
    { key: { username_lower: 1, date_key: 1 } },
    { key: { date_key: 1, username_lower: 1, created_at: -1 } },
    
    // Text search index
    { key: { username: 'text', url: 'text' } },
    
    // TTL index for automatic cleanup (optional - 1 year retention)
    { key: { created_at: 1 }, expireAfterSeconds: 365 * 24 * 60 * 60 }
  ]
} as const;

// =====================================================
// VALIDATION SCHEMAS
// =====================================================

export const VALIDATION_SCHEMAS = {
  AUDIT_LOGS: {
    $jsonSchema: {
      bsonType: 'object',
      required: ['audit_id', 'timestamp', 'server_timestamp', 'url', 'user_agent', 'localStorage_data', 'localStorage_size', 'created_at', 'date_key'],
      properties: {
        audit_id: {
          bsonType: 'string',
          pattern: '^[a-zA-Z0-9_]+_[0-9]+_[a-zA-Z0-9]+$',
          description: 'Unique audit identifier in format: username_timestamp_random'
        },
        timestamp: {
          bsonType: 'date',
          description: 'Client timestamp when audit was created'
        },
        server_timestamp: {
          bsonType: 'date',
          description: 'Server timestamp when audit was received'
        },
        username: {
          bsonType: ['string', 'null'],
          maxLength: 100,
          description: 'Username if available'
        },
        session_id: {
          bsonType: ['string', 'null'],
          description: 'Session identifier'
        },
        url: {
          bsonType: 'string',
          description: 'URL where audit was triggered'
        },
        user_agent: {
          bsonType: 'string',
          description: 'Browser user agent'
        },
        client_ip: {
          bsonType: 'string',
          description: 'Client IP address'
        },
        app_version: {
          bsonType: ['string', 'null'],
          description: 'Application version'
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
        created_at: {
          bsonType: 'date',
          description: 'Document creation timestamp'
        },
        date_key: {
          bsonType: 'string',
          pattern: '^[0-9]{4}-[0-9]{2}-[0-9]{2}$',
          description: 'Date in YYYY-MM-DD format for indexing'
        },
        username_lower: {
          bsonType: ['string', 'null'],
          description: 'Lowercase username for case-insensitive queries'
        },
        metadata: {
          bsonType: ['object', 'null'],
          description: 'Additional metadata'
        }
      }
    }
  }
} as const;

// =====================================================
// HELPER TYPES
// =====================================================

export type AuditLogInsert = Omit<AuditLog, '_id'>;
export type AuditLogUpdate = Partial<Omit<AuditLog, '_id' | 'audit_id'>>;

// =====================================================
// ERROR TYPES
// =====================================================

export interface MongoDBError {
  code: string;
  message: string;
  details?: any;
}

export class AuditServiceError extends Error {
  constructor(
    message: string,
    public code: string,
    public details?: any
  ) {
    super(message);
    this.name = 'AuditServiceError';
  }
}
