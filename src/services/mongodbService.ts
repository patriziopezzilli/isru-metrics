// =====================================================
// MONGODB SERVICE - MongoDB Atlas Connection & Operations
// Servizio per gestire la connessione a MongoDB Atlas e operazioni audit
// =====================================================

import { MongoClient, Db, Collection, CreateIndexesOptions } from 'mongodb';
import {
  AuditLog,
  AuditLogInsert,
  AuditQueryOptions,
  AuditListResponse,
  AuditStatsResponse,
  MongoDBConfig,
  COLLECTIONS,
  INDEXES,
  VALIDATION_SCHEMAS,
  AuditServiceError
} from '../types/mongodb';

// =====================================================
// MONGODB SERVICE CLASS
// =====================================================

export class MongoDBService {
  private client: MongoClient | null = null;
  private db: Db | null = null;
  private isConnected: boolean = false;
  private config: MongoDBConfig;

  constructor(config: MongoDBConfig) {
    this.config = config;
  }

  // =====================================================
  // CONNECTION MANAGEMENT
  // =====================================================

  async connect(): Promise<void> {
    try {
      console.log('🔗 Connecting to MongoDB Atlas...');
      
      this.client = new MongoClient(this.config.connection_string, {
        maxPoolSize: this.config.options?.maxPoolSize || 10,
        minPoolSize: this.config.options?.minPoolSize || 2,
        maxIdleTimeMS: this.config.options?.maxIdleTimeMS || 30000,
        serverSelectionTimeoutMS: this.config.options?.serverSelectionTimeoutMS || 5000,
        socketTimeoutMS: this.config.options?.socketTimeoutMS || 45000,
        connectTimeoutMS: this.config.options?.connectTimeoutMS || 10000,
        retryWrites: this.config.options?.retryWrites ?? true,
        retryReads: this.config.options?.retryReads ?? true,
      });

      await this.client.connect();
      this.db = this.client.db(this.config.database_name);
      this.isConnected = true;

      console.log('✅ Connected to MongoDB Atlas successfully');
      
      // Initialize collections and indexes
      await this.initializeCollections();
      
    } catch (error) {
      console.error('❌ MongoDB connection failed:', error);
      this.isConnected = false;
      throw new AuditServiceError(
        'Failed to connect to MongoDB',
        'CONNECTION_ERROR',
        error
      );
    }
  }

  async disconnect(): Promise<void> {
    try {
      if (this.client) {
        await this.client.close();
        console.log('🔌 Disconnected from MongoDB Atlas');
      }
      this.isConnected = false;
      this.client = null;
      this.db = null;
    } catch (error) {
      console.error('❌ Error disconnecting from MongoDB:', error);
    }
  }

  async testConnection(): Promise<boolean> {
    try {
      if (!this.db) {
        await this.connect();
      }
      
      await this.db!.admin().ping();
      console.log('🏓 MongoDB connection test successful');
      return true;
    } catch (error) {
      console.error('❌ MongoDB connection test failed:', error);
      return false;
    }
  }

  getConnectionStatus(): boolean {
    return this.isConnected;
  }

  // =====================================================
  // COLLECTION INITIALIZATION
  // =====================================================

  private async initializeCollections(): Promise<void> {
    try {
      console.log('🏗️ Initializing MongoDB collections...');
      
      // Create audit_logs collection with validation
      await this.createCollectionWithValidation(
        COLLECTIONS.AUDIT_LOGS,
        VALIDATION_SCHEMAS.AUDIT_LOGS
      );
      
      // Create indexes
      await this.createIndexes();
      
      console.log('✅ Collections initialized successfully');
    } catch (error) {
      console.error('❌ Failed to initialize collections:', error);
      throw error;
    }
  }

  private async createCollectionWithValidation(
    collectionName: string,
    validationSchema: any
  ): Promise<void> {
    try {
      const collections = await this.db!.listCollections({ name: collectionName }).toArray();
      
      if (collections.length === 0) {
        await this.db!.createCollection(collectionName, {
          validator: validationSchema
        });
        console.log(`📄 Created collection: ${collectionName}`);
      } else {
        console.log(`📄 Collection already exists: ${collectionName}`);
      }
    } catch (error) {
      console.error(`❌ Failed to create collection ${collectionName}:`, error);
      throw error;
    }
  }

  private async createIndexes(): Promise<void> {
    try {
      const auditCollection = this.getAuditCollection();
      
      for (const indexSpec of INDEXES.AUDIT_LOGS) {
        try {
          await auditCollection.createIndex(indexSpec.key, {
            unique: indexSpec.unique || false,
            expireAfterSeconds: indexSpec.expireAfterSeconds,
            background: true
          } as CreateIndexesOptions);
          
          console.log(`📊 Created index:`, indexSpec.key);
        } catch (error: any) {
          // Ignore duplicate index errors
          if (error.code !== 85) {
            console.warn(`⚠️ Failed to create index:`, indexSpec.key, error.message);
          }
        }
      }
    } catch (error) {
      console.error('❌ Failed to create indexes:', error);
      throw error;
    }
  }

  // =====================================================
  // COLLECTION GETTERS
  // =====================================================

  private getAuditCollection(): Collection<AuditLog> {
    if (!this.db) {
      throw new AuditServiceError('Database not connected', 'NOT_CONNECTED');
    }
    return this.db.collection<AuditLog>(COLLECTIONS.AUDIT_LOGS);
  }

  // =====================================================
  // AUDIT OPERATIONS
  // =====================================================

  async saveAudit(auditData: AuditLogInsert): Promise<string> {
    try {
      const collection = this.getAuditCollection();
      
      // Ensure required fields are set
      const audit: AuditLogInsert = {
        ...auditData,
        created_at: auditData.created_at || new Date(),
        date_key: auditData.date_key || this.formatDateKey(auditData.server_timestamp),
        username_lower: auditData.username?.toLowerCase() || undefined,
      };

      const result = await collection.insertOne(audit);
      
      console.log('✅ Audit saved to MongoDB:', audit.audit_id);
      return result.insertedId.toString();
      
    } catch (error) {
      console.error('❌ Failed to save audit:', error);
      throw new AuditServiceError(
        'Failed to save audit to MongoDB',
        'SAVE_ERROR',
        error
      );
    }
  }

  async getAudit(auditId: string): Promise<AuditLog | null> {
    try {
      const collection = this.getAuditCollection();
      const audit = await collection.findOne({ audit_id: auditId });
      return audit;
    } catch (error) {
      console.error('❌ Failed to get audit:', error);
      throw new AuditServiceError(
        'Failed to retrieve audit from MongoDB',
        'GET_ERROR',
        error
      );
    }
  }

  async listAudits(options: AuditQueryOptions = {}): Promise<AuditListResponse> {
    try {
      const collection = this.getAuditCollection();
      
      // Build query filter
      const filter: any = {};
      
      if (options.username) {
        filter.username_lower = options.username.toLowerCase();
      }
      
      if (options.date_key) {
        filter.date_key = options.date_key;
      }
      
      if (options.date_from || options.date_to) {
        filter.created_at = {};
        if (options.date_from) {
          filter.created_at.$gte = options.date_from;
        }
        if (options.date_to) {
          filter.created_at.$lte = options.date_to;
        }
      }

      // Set pagination
      const limit = Math.min(options.limit || 50, 100); // Max 100 per page
      const skip = options.skip || 0;
      
      // Set sort (default: newest first)
      const sort = options.sort || { created_at: -1 };

      // Execute query
      const [audits, total] = await Promise.all([
        collection
          .find(filter)
          .sort(sort)
          .skip(skip)
          .limit(limit)
          .toArray(),
        collection.countDocuments(filter)
      ]);

      return {
        audits,
        total,
        page: Math.floor(skip / limit) + 1,
        limit,
        has_more: skip + limit < total
      };
      
    } catch (error) {
      console.error('❌ Failed to list audits:', error);
      throw new AuditServiceError(
        'Failed to list audits from MongoDB',
        'LIST_ERROR',
        error
      );
    }
  }

  // =====================================================
  // STATISTICS AND ANALYTICS
  // =====================================================

  async getAuditStats(dateFrom?: Date, dateTo?: Date): Promise<AuditStatsResponse> {
    try {
      const collection = this.getAuditCollection();

      // Build match filter
      const matchFilter: any = {};
      if (dateFrom || dateTo) {
        matchFilter.created_at = {};
        if (dateFrom) matchFilter.created_at.$gte = dateFrom;
        if (dateTo) matchFilter.created_at.$lte = dateTo;
      }

      const pipeline = [
        ...(Object.keys(matchFilter).length > 0 ? [{ $match: matchFilter }] : []),
        {
          $group: {
            _id: null,
            total_audits: { $sum: 1 },
            unique_users: { $addToSet: '$username_lower' },
            avg_localStorage_size: { $avg: '$localStorage_size' },
            max_localStorage_size: { $max: '$localStorage_size' },
            earliest_date: { $min: '$created_at' },
            latest_date: { $max: '$created_at' }
          }
        },
        {
          $project: {
            total_audits: 1,
            unique_users: { $size: '$unique_users' },
            avg_localStorage_size: { $round: ['$avg_localStorage_size', 2] },
            max_localStorage_size: 1,
            earliest_date: 1,
            latest_date: 1
          }
        }
      ];

      const [stats] = await collection.aggregate(pipeline).toArray();

      // Get top users
      const topUsersPipeline = [
        ...(Object.keys(matchFilter).length > 0 ? [{ $match: matchFilter }] : []),
        { $match: { username_lower: { $ne: null } } },
        {
          $group: {
            _id: '$username_lower',
            audit_count: { $sum: 1 }
          }
        },
        { $sort: { audit_count: -1 } },
        { $limit: 10 },
        {
          $project: {
            username: '$_id',
            audit_count: 1,
            _id: 0
          }
        }
      ];

      const topUsers = await collection.aggregate(topUsersPipeline).toArray();

      return {
        total_audits: stats?.total_audits || 0,
        unique_users: stats?.unique_users || 0,
        date_range: {
          earliest: stats?.earliest_date || new Date(),
          latest: stats?.latest_date || new Date()
        },
        avg_localStorage_size: stats?.avg_localStorage_size || 0,
        max_localStorage_size: stats?.max_localStorage_size || 0,
        top_users: topUsers
      };

    } catch (error) {
      console.error('❌ Failed to get audit stats:', error);
      throw new AuditServiceError(
        'Failed to get audit statistics',
        'STATS_ERROR',
        error
      );
    }
  }

  async deleteOldAudits(olderThanDays: number): Promise<number> {
    try {
      const collection = this.getAuditCollection();
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - olderThanDays);

      const result = await collection.deleteMany({
        created_at: { $lt: cutoffDate }
      });

      console.log(`🗑️ Deleted ${result.deletedCount} old audit records`);
      return result.deletedCount;

    } catch (error) {
      console.error('❌ Failed to delete old audits:', error);
      throw new AuditServiceError(
        'Failed to delete old audits',
        'DELETE_ERROR',
        error
      );
    }
  }

  // =====================================================
  // HELPER METHODS
  // =====================================================

  private formatDateKey(date: Date): string {
    return date.toISOString().split('T')[0]; // YYYY-MM-DD
  }

  generateAuditId(username?: string): string {
    const timestamp = Date.now();
    const user = username || 'anonymous';
    const random = Math.random().toString(36).substr(2, 8);
    return `${user}_${timestamp}_${random}`;
  }
}

// =====================================================
// FACTORY FUNCTION
// =====================================================

export function createMongoDBService(customConfig?: Partial<MongoDBConfig>): MongoDBService {
  const defaultConfig: MongoDBConfig = {
    connection_string: process.env.MONGODB_CONNECTION_STRING || '',
    database_name: process.env.MONGODB_DATABASE_NAME || 'isru_metrics',
    options: {
      maxPoolSize: parseInt(process.env.MONGODB_MAX_POOL_SIZE || '10'),
      minPoolSize: parseInt(process.env.MONGODB_MIN_POOL_SIZE || '2'),
      maxIdleTimeMS: parseInt(process.env.MONGODB_MAX_IDLE_TIME_MS || '30000'),
      serverSelectionTimeoutMS: parseInt(process.env.MONGODB_SERVER_SELECTION_TIMEOUT_MS || '5000'),
      socketTimeoutMS: parseInt(process.env.MONGODB_SOCKET_TIMEOUT_MS || '45000'),
      connectTimeoutMS: parseInt(process.env.MONGODB_CONNECT_TIMEOUT_MS || '10000'),
      retryWrites: process.env.MONGODB_RETRY_WRITES !== 'false',
      retryReads: process.env.MONGODB_RETRY_READS !== 'false',
    }
  };

  const config = { ...defaultConfig, ...customConfig };
  
  if (!config.connection_string) {
    throw new AuditServiceError(
      'MongoDB connection string is required',
      'CONFIG_ERROR'
    );
  }

  return new MongoDBService(config);
}

export default MongoDBService;
