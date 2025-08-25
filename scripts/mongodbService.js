// =====================================================
// MONGODB SERVICE - JavaScript Version for Testing
// Versione JavaScript del servizio MongoDB per test
// =====================================================

import { MongoClient } from 'mongodb';

// =====================================================
// COLLECTIONS AND INDEXES
// =====================================================

const COLLECTIONS = {
  AUDIT_LOGS: 'audit_logs',
  AUDIT_STATS: 'audit_stats',
  ACTIVITY_TRACKING: 'activity_tracking',
};

const INDEXES = {
  AUDIT_LOGS: [
    { key: { audit_id: 1 }, unique: true },
    { key: { username_lower: 1, created_at: -1 } },
    { key: { date_key: 1, created_at: -1 } },
    { key: { created_at: -1 } },
    { key: { username_lower: 1, date_key: 1 } },
    { key: { date_key: 1, username_lower: 1, created_at: -1 } },
    { key: { username: 'text', url: 'text' } },
    { key: { created_at: 1 }, expireAfterSeconds: 365 * 24 * 60 * 60 }
  ],
  ACTIVITY_TRACKING: [
    { key: { activity_id: 1 }, unique: true },
    { key: { session_id: 1 } },
    { key: { username_lower: 1, created_at: -1 } },
    { key: { date_key: 1, created_at: -1 } },
    { key: { created_at: -1 } },
    { key: { activity_score: -1 } },
    { key: { engagement_level: 1, created_at: -1 } },
    { key: { username_lower: 1, activity_score: -1 } },
    { key: { created_at: 1 }, expireAfterSeconds: 30 * 24 * 60 * 60 } // 30 days TTL
  ]
};

// =====================================================
// MONGODB SERVICE CLASS
// =====================================================

export class MongoDBService {
  constructor(config) {
    this.config = config;
    this.client = null;
    this.db = null;
    this.isConnected = false;
  }

  async connect() {
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
      throw new Error(`Failed to connect to MongoDB: ${error.message}`);
    }
  }

  async disconnect() {
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

  async testConnection() {
    try {
      if (!this.db) {
        await this.connect();
      }
      
      await this.db.admin().ping();
      console.log('🏓 MongoDB connection test successful');
      return true;
    } catch (error) {
      console.error('❌ MongoDB connection test failed:', error);
      return false;
    }
  }

  getConnectionStatus() {
    return this.isConnected;
  }

  async initializeCollections() {
    try {
      console.log('🏗️ Initializing MongoDB collections...');
      
      // Create audit_logs collection
      await this.createCollectionIfNotExists(COLLECTIONS.AUDIT_LOGS);
      
      // Create indexes
      await this.createIndexes();
      
      console.log('✅ Collections initialized successfully');
    } catch (error) {
      console.error('❌ Failed to initialize collections:', error);
      throw error;
    }
  }

  async createCollectionIfNotExists(collectionName) {
    try {
      const collections = await this.db.listCollections({ name: collectionName }).toArray();
      
      if (collections.length === 0) {
        await this.db.createCollection(collectionName);
        console.log(`📄 Created collection: ${collectionName}`);
      } else {
        console.log(`📄 Collection already exists: ${collectionName}`);
      }
    } catch (error) {
      console.error(`❌ Failed to create collection ${collectionName}:`, error);
      throw error;
    }
  }

  async createIndexes() {
    try {
      const auditCollection = this.getAuditCollection();
      
      for (const indexSpec of INDEXES.AUDIT_LOGS) {
        try {
          await auditCollection.createIndex(indexSpec.key, {
            unique: indexSpec.unique || false,
            expireAfterSeconds: indexSpec.expireAfterSeconds,
            background: true
          });
          
          console.log(`📊 Created index:`, indexSpec.key);
        } catch (error) {
          // Ignore duplicate index errors
          if (error.code !== 85) {
            console.warn(`⚠️ Failed to create index:`, indexSpec.key, error.message);
          }
        }
      }

      // Create activity tracking indexes
      const activityCollection = this.getActivityCollection();

      for (const indexSpec of INDEXES.ACTIVITY_TRACKING) {
        try {
          await activityCollection.createIndex(indexSpec.key, {
            unique: indexSpec.unique || false,
            expireAfterSeconds: indexSpec.expireAfterSeconds,
            background: true
          });

          console.log(`🎯 Created activity index:`, indexSpec.key);
        } catch (error) {
          // Ignore duplicate index errors
          if (error.code !== 85) {
            console.warn(`⚠️ Failed to create activity index:`, indexSpec.key, error.message);
          }
        }
      }

    } catch (error) {
      console.error('❌ Failed to create indexes:', error);
      throw error;
    }
  }

  getAuditCollection() {
    if (!this.db) {
      throw new Error('Database not connected');
    }
    return this.db.collection(COLLECTIONS.AUDIT_LOGS);
  }

  getActivityCollection() {
    if (!this.db) {
      throw new Error('Database not connected');
    }
    return this.db.collection(COLLECTIONS.ACTIVITY_TRACKING);
  }

  async saveAudit(auditData) {
    try {
      const collection = this.getAuditCollection();
      
      // Ensure required fields are set
      const audit = {
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
      throw new Error(`Failed to save audit to MongoDB: ${error.message}`);
    }
  }

  async upsertAuditByUsername(username, auditData) {
    try {
      const collection = this.getAuditCollection();
      const usernameLower = username.toLowerCase();

      // Prepare audit data with timestamps
      const now = new Date();
      const audit = {
        ...auditData,
        username: username,
        username_lower: usernameLower,
        updated_at: now,
        server_timestamp: now,
        date_key: this.formatDateKey(now)
      };

      // Set created_at only if it's a new document
      const updateData = {
        $set: audit,
        $setOnInsert: {
          created_at: now,
          audit_id: auditData.audit_id || this.generateAuditId(username)
        }
      };

      // Upsert: update if exists, insert if not
      const result = await collection.updateOne(
        { username_lower: usernameLower },
        updateData,
        { upsert: true }
      );

      console.log('✅ Audit upserted for user:', username, {
        matched: result.matchedCount,
        modified: result.modifiedCount,
        upserted: !!result.upsertedId
      });

      return {
        matchedCount: result.matchedCount,
        modifiedCount: result.modifiedCount,
        upserted: !!result.upsertedId,
        upsertedId: result.upsertedId
      };

    } catch (error) {
      console.error('❌ Failed to upsert audit:', error);
      throw new Error(`Failed to upsert audit to MongoDB: ${error.message}`);
    }
  }

  async getAudit(auditId) {
    try {
      const collection = this.getAuditCollection();
      const audit = await collection.findOne({ audit_id: auditId });
      return audit;
    } catch (error) {
      console.error('❌ Failed to get audit:', error);
      throw new Error(`Failed to retrieve audit from MongoDB: ${error.message}`);
    }
  }

  async listAudits(options = {}) {
    try {
      const collection = this.getAuditCollection();
      
      // Build query filter
      const filter = {};
      
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
      const limit = Math.min(options.limit || 50, 100);
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
      throw new Error(`Failed to list audits from MongoDB: ${error.message}`);
    }
  }

  async getAuditStats(dateFrom, dateTo) {
    try {
      const collection = this.getAuditCollection();
      
      // Build match filter
      const matchFilter = {};
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
      throw new Error(`Failed to get audit statistics: ${error.message}`);
    }
  }

  formatDateKey(date) {
    return date.toISOString().split('T')[0]; // YYYY-MM-DD
  }

  generateAuditId(username) {
    const timestamp = Date.now();
    const user = username || 'anonymous';
    const random = Math.random().toString(36).substr(2, 8);
    return `${user}_${timestamp}_${random}`;
  }

  // =====================================================
  // ACTIVITY TRACKING METHODS
  // =====================================================

  async saveActivity(activityData) {
    try {
      const collection = this.getActivityCollection();

      // Ensure required fields are set
      const activity = {
        ...activityData,
        created_at: activityData.created_at || new Date(),
        server_timestamp: activityData.server_timestamp || new Date()
      };

      const result = await collection.insertOne(activity);
      console.log('✅ Activity saved to MongoDB:', activity.activity_id);

      return {
        success: true,
        activity_id: activity.activity_id,
        inserted_id: result.insertedId
      };

    } catch (error) {
      console.error('❌ Failed to save activity:', error);
      throw error;
    }
  }

  async getActivityLeaderboard(options = {}) {
    try {
      const collection = this.getActivityCollection();
      const { limit = 50, dateFrom, dateTo } = options;

      // Build match filter
      const matchFilter = {};

      if (dateFrom || dateTo) {
        matchFilter.created_at = {};
        if (dateFrom) matchFilter.created_at.$gte = new Date(dateFrom);
        if (dateTo) matchFilter.created_at.$lte = new Date(dateTo);
      }

      // Only include users with usernames
      matchFilter.username_lower = { $ne: null };

      const pipeline = [
        { $match: matchFilter },
        {
          $group: {
            _id: '$username_lower',
            username: { $first: '$username' },
            total_activity_score: { $sum: '$activity_score' },
            total_sessions: { $sum: 1 },
            total_events: { $sum: { $size: '$events' } },
            avg_session_duration: { $avg: '$session_duration' },
            last_activity: { $max: '$created_at' },
            engagement_levels: { $push: '$engagement_level' }
          }
        },
        {
          $addFields: {
            avg_session_minutes: { $round: [{ $divide: ['$avg_session_duration', 60000] }, 1] },
            high_engagement_sessions: {
              $size: {
                $filter: {
                  input: '$engagement_levels',
                  cond: { $in: ['$$this', ['high', 'very_high']] }
                }
              }
            }
          }
        },
        { $sort: { total_activity_score: -1 } },
        { $limit: limit }
      ];

      const leaderboard = await collection.aggregate(pipeline).toArray();

      return {
        leaderboard,
        total_users: leaderboard.length,
        generated_at: new Date().toISOString()
      };

    } catch (error) {
      console.error('❌ Failed to get activity leaderboard:', error);
      throw error;
    }
  }

  async getUserActivityStats(username) {
    try {
      const collection = this.getActivityCollection();
      const usernameLower = username.toLowerCase();

      const pipeline = [
        { $match: { username_lower: usernameLower } },
        {
          $group: {
            _id: null,
            total_activity_score: { $sum: '$activity_score' },
            total_sessions: { $sum: 1 },
            total_events: { $sum: { $size: '$events' } },
            avg_session_duration: { $avg: '$session_duration' },
            total_clicks: { $sum: '$total_clicks' },
            total_page_views: { $sum: { $size: '$page_views' } },
            last_activity: { $max: '$created_at' },
            first_activity: { $min: '$created_at' },
            engagement_levels: { $push: '$engagement_level' }
          }
        },
        {
          $addFields: {
            avg_session_minutes: { $round: [{ $divide: ['$avg_session_duration', 60000] }, 1] },
            high_engagement_sessions: {
              $size: {
                $filter: {
                  input: '$engagement_levels',
                  cond: { $in: ['$$this', ['high', 'very_high']] }
                }
              }
            }
          }
        }
      ];

      const stats = await collection.aggregate(pipeline).toArray();

      return stats.length > 0 ? stats[0] : null;

    } catch (error) {
      console.error('❌ Failed to get user activity stats:', error);
      throw error;
    }
  }
}

// =====================================================
// FACTORY FUNCTION
// =====================================================

export function createMongoDBService(customConfig) {
  const defaultConfig = {
    connection_string: process.env.MONGODB_CONNECTION_STRING || '',
    database_name: process.env.MONGODB_DATABASE_NAME || 'isru_metrics',
    options: {
      maxPoolSize: parseInt(process.env.MONGODB_MAX_POOL_SIZE || '10'),
      minPoolSize: parseInt(process.env.MONGODB_MIN_POOL_SIZE || '2'),
      maxIdleTimeMS: parseInt(process.env.MONGODB_MAX_IDLE_TIME_MS || '30000'),
      serverSelectionTimeoutMS: parseInt(process.env.MONGODB_SERVER_SELECTION_TIMEOUT_MS || '30000'),
      socketTimeoutMS: parseInt(process.env.MONGODB_SOCKET_TIMEOUT_MS || '45000'),
      connectTimeoutMS: parseInt(process.env.MONGODB_CONNECT_TIMEOUT_MS || '30000'),
      retryWrites: process.env.MONGODB_RETRY_WRITES !== 'false',
      retryReads: process.env.MONGODB_RETRY_READS !== 'false',
    }
  };

  const config = { ...defaultConfig, ...customConfig };
  
  if (!config.connection_string) {
    throw new Error('MongoDB connection string is required');
  }

  return new MongoDBService(config);
}
