#!/usr/bin/env node

// =====================================================
// MONGODB CONNECTION TEST
// Script per testare la connessione a MongoDB Atlas
// =====================================================

import dotenv from 'dotenv';
import { createMongoDBService } from './mongodbService.js';

// Load environment variables
dotenv.config({ path: '.env.local' });

async function testConnection() {
    console.log('🧪 Testing MongoDB Atlas connection...');
    console.log('🔍 Connection string:', process.env.MONGODB_CONNECTION_STRING?.replace(/admin:[^@]+@/, 'admin:***@'));
    console.log('🗄️ Database name:', process.env.MONGODB_DATABASE_NAME);

    let mongoService;
    
    try {
        // Create service
        mongoService = createMongoDBService();
        
        // Test connection
        console.log('🔗 Connecting to MongoDB Atlas...');
        await mongoService.connect();
        console.log('✅ Connection successful!');
        
        // Test basic operations
        console.log('🧪 Testing basic operations...');
        
        // Create a test audit
        const testAudit = {
            audit_id: `test_${Date.now()}_${Math.random().toString(36).substr(2, 8)}`,
            timestamp: new Date(),
            server_timestamp: new Date(),
            username: 'test_user',
            url: 'https://test.example.com',
            user_agent: 'Test Agent',
            client_ip: '127.0.0.1',
            localStorage_data: { test: 'data' },
            localStorage_size: 100,
            created_at: new Date(),
            date_key: new Date().toISOString().split('T')[0],
            username_lower: 'test_user',
            metadata: {
                source: 'connection_test',
                version: '1.0'
            }
        };
        
        // Save test audit
        console.log('💾 Saving test audit...');
        const insertedId = await mongoService.saveAudit(testAudit);
        console.log(`✅ Test audit saved with ID: ${insertedId}`);
        
        // Retrieve test audit
        console.log('🔍 Retrieving test audit...');
        const retrievedAudit = await mongoService.getAudit(testAudit.audit_id);
        if (retrievedAudit) {
            console.log('✅ Test audit retrieved successfully');
        } else {
            throw new Error('Failed to retrieve test audit');
        }
        
        // Test list audits
        console.log('📋 Testing audit list...');
        const auditList = await mongoService.listAudits({ limit: 5 });
        console.log(`✅ Retrieved ${auditList.audits.length} audits from list`);
        
        // Test stats
        console.log('📊 Testing audit stats...');
        const stats = await mongoService.getAuditStats();
        console.log(`✅ Stats retrieved: ${stats.total_audits} total audits, ${stats.unique_users} unique users`);
        
        console.log('\n🎉 All tests passed! MongoDB Atlas is ready to use.');
        
        return {
            success: true,
            test_audit_id: testAudit.audit_id,
            stats: stats
        };
        
    } catch (error) {
        console.error('❌ Test failed:', error.message);
        return {
            success: false,
            error: error.message
        };
    } finally {
        if (mongoService) {
            await mongoService.disconnect();
            console.log('🔌 Disconnected from MongoDB Atlas');
        }
    }
}

// Run test if script is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
    testConnection()
        .then(result => {
            if (result.success) {
                console.log('\n✅ MongoDB Atlas connection test completed successfully!');
                process.exit(0);
            } else {
                console.log('\n❌ MongoDB Atlas connection test failed!');
                process.exit(1);
            }
        })
        .catch(error => {
            console.error('💥 Test script crashed:', error);
            process.exit(1);
        });
}

export { testConnection };
