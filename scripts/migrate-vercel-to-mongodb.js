#!/usr/bin/env node

// =====================================================
// MIGRATION SCRIPT - Vercel Blob to MongoDB Atlas
// Script per migrare i dati audit da Vercel Blob Store a MongoDB Atlas
// =====================================================

import { createMongoDBService } from './mongodbService.js';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

// =====================================================
// CONFIGURATION
// =====================================================

const BATCH_SIZE = 50; // Process 50 files at a time
const DRY_RUN = process.env.DRY_RUN === 'true'; // Set to true for testing
const VERBOSE = process.env.VERBOSE === 'true';

// =====================================================
// MAIN MIGRATION FUNCTION
// =====================================================

async function migrateData() {
    console.log('🚀 Starting migration from Vercel Blob to MongoDB Atlas...');
    console.log(`📋 Configuration: DRY_RUN=${DRY_RUN}, BATCH_SIZE=${BATCH_SIZE}`);

    // Load environment variables
    dotenv.config({ path: '.env.local' });

    let mongoService;
    let migrationStats = {
        total_files: 0,
        processed: 0,
        successful: 0,
        failed: 0,
        skipped: 0,
        errors: []
    };

    try {
        // Initialize MongoDB service
        console.log('🔗 Connecting to MongoDB Atlas...');
        mongoService = createMongoDBService();
        await mongoService.connect();
        console.log('✅ Connected to MongoDB Atlas');

        // Get list of all blob files
        console.log('📋 Fetching list of files from Vercel Blob...');
        const { blobs } = await list();
        
        // Filter only audit files
        const auditBlobs = blobs.filter(blob => 
            blob.pathname.startsWith('audit/') && 
            blob.pathname.endsWith('.json') &&
            !blob.pathname.includes('/index/')
        );

        migrationStats.total_files = auditBlobs.length;
        console.log(`📊 Found ${auditBlobs.length} audit files to migrate`);

        if (auditBlobs.length === 0) {
            console.log('ℹ️ No audit files found to migrate');
            return migrationStats;
        }

        // Process files in batches
        for (let i = 0; i < auditBlobs.length; i += BATCH_SIZE) {
            const batch = auditBlobs.slice(i, i + BATCH_SIZE);
            console.log(`\n📦 Processing batch ${Math.floor(i / BATCH_SIZE) + 1}/${Math.ceil(auditBlobs.length / BATCH_SIZE)} (${batch.length} files)`);
            
            await processBatch(batch, mongoService, migrationStats);
            
            // Small delay between batches to avoid overwhelming the services
            if (i + BATCH_SIZE < auditBlobs.length) {
                await new Promise(resolve => setTimeout(resolve, 1000));
            }
        }

        console.log('\n🎉 Migration completed!');
        printMigrationStats(migrationStats);

    } catch (error) {
        console.error('❌ Migration failed:', error);
        migrationStats.errors.push({
            type: 'MIGRATION_ERROR',
            message: error.message,
            timestamp: new Date().toISOString()
        });
    } finally {
        if (mongoService) {
            await mongoService.disconnect();
            console.log('🔌 Disconnected from MongoDB Atlas');
        }
    }

    // Save migration report
    await saveMigrationReport(migrationStats);
    
    return migrationStats;
}

// =====================================================
// BATCH PROCESSING
// =====================================================

async function processBatch(batch, mongoService, stats) {
    const promises = batch.map(blob => processFile(blob, mongoService, stats));
    await Promise.allSettled(promises);
}

async function processFile(blob, mongoService, stats) {
    try {
        stats.processed++;
        
        if (VERBOSE) {
            console.log(`  📄 Processing: ${blob.pathname}`);
        }

        // Download and parse the blob data
        const response = await fetch(blob.url);
        if (!response.ok) {
            throw new Error(`Failed to fetch blob: ${response.status} ${response.statusText}`);
        }

        const auditData = await response.json();
        
        // Check if this audit already exists in MongoDB
        const existingAudit = await mongoService.getAudit(auditData.audit_id);
        if (existingAudit) {
            if (VERBOSE) {
                console.log(`  ⏭️ Skipping existing audit: ${auditData.audit_id}`);
            }
            stats.skipped++;
            return;
        }

        // Transform Vercel Blob data to MongoDB format
        const mongoAuditData = transformBlobToMongo(auditData);

        if (!DRY_RUN) {
            // Save to MongoDB
            await mongoService.saveAudit(mongoAuditData);
        }

        stats.successful++;
        
        if (VERBOSE) {
            console.log(`  ✅ Migrated: ${auditData.audit_id}`);
        }

    } catch (error) {
        stats.failed++;
        const errorInfo = {
            file: blob.pathname,
            error: error.message,
            timestamp: new Date().toISOString()
        };
        stats.errors.push(errorInfo);
        
        console.error(`  ❌ Failed to process ${blob.pathname}:`, error.message);
    }
}

// =====================================================
// DATA TRANSFORMATION
// =====================================================

function transformBlobToMongo(blobData) {
    // Convert Vercel Blob format to MongoDB format
    const serverTimestamp = new Date(blobData.server_timestamp);
    
    return {
        audit_id: blobData.audit_id,
        timestamp: new Date(blobData.timestamp),
        server_timestamp: serverTimestamp,
        username: blobData.username || undefined,
        session_id: blobData.session_id || undefined,
        url: blobData.url,
        user_agent: blobData.user_agent,
        client_ip: blobData.client_ip,
        app_version: blobData.app_version || undefined,
        localStorage_data: blobData.localStorage_data || {},
        localStorage_size: blobData.localStorage_size || 0,
        created_at: serverTimestamp,
        date_key: serverTimestamp.toISOString().split('T')[0],
        username_lower: blobData.username?.toLowerCase() || undefined,
        metadata: {
            source: 'isru-metrics-app',
            version: '2.0',
            migration_source: 'vercel_blob',
            original_blob_url: blobData.url || undefined,
            migrated_at: new Date().toISOString()
        }
    };
}

// =====================================================
// REPORTING
// =====================================================

function printMigrationStats(stats) {
    console.log('\n📊 Migration Statistics:');
    console.log(`  Total files found: ${stats.total_files}`);
    console.log(`  Files processed: ${stats.processed}`);
    console.log(`  Successfully migrated: ${stats.successful}`);
    console.log(`  Skipped (already exist): ${stats.skipped}`);
    console.log(`  Failed: ${stats.failed}`);
    
    if (stats.errors.length > 0) {
        console.log(`\n❌ Errors (${stats.errors.length}):`);
        stats.errors.forEach((error, index) => {
            console.log(`  ${index + 1}. ${error.file || 'Unknown'}: ${error.error}`);
        });
    }
    
    const successRate = stats.processed > 0 ? ((stats.successful / stats.processed) * 100).toFixed(2) : 0;
    console.log(`\n✅ Success rate: ${successRate}%`);
}

async function saveMigrationReport(stats) {
    const reportPath = `migration-report-${new Date().toISOString().replace(/[:.]/g, '-')}.json`;
    
    try {
        const report = {
            migration_date: new Date().toISOString(),
            configuration: {
                dry_run: DRY_RUN,
                batch_size: BATCH_SIZE,
                verbose: VERBOSE
            },
            statistics: stats,
            environment: {
                node_version: process.version,
                platform: process.platform
            }
        };
        
        fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
        console.log(`📄 Migration report saved: ${reportPath}`);
    } catch (error) {
        console.error('❌ Failed to save migration report:', error.message);
    }
}

// =====================================================
// SCRIPT EXECUTION
// =====================================================

if (import.meta.url === `file://${process.argv[1]}`) {
    migrateData()
        .then(stats => {
            const exitCode = stats.failed > 0 ? 1 : 0;
            process.exit(exitCode);
        })
        .catch(error => {
            console.error('💥 Migration script crashed:', error);
            process.exit(1);
        });
}

export { migrateData };
