// =====================================================
// HEALTH CHECK ENDPOINT - MongoDB Atlas
// API endpoint per verificare lo stato di MongoDB Atlas
// =====================================================

import { createMongoDBService } from '../scripts/mongodbService.js';
import dotenv from 'dotenv';

// Load environment variables in production
if (process.env.NODE_ENV !== 'production') {
    dotenv.config({ path: '.env.local' });
}

export default async function handler(req, res) {
    // Solo GET requests
    if (req.method !== 'GET') {
        return res.status(405).json({ 
            error: 'Method not allowed',
            message: 'Only GET requests are accepted'
        });
    }

    const healthCheck = {
        timestamp: new Date().toISOString(),
        service: 'mongodb-atlas',
        status: 'unknown',
        details: {}
    };

    try {
        console.log('🏥 Health check request for MongoDB Atlas');
        
        // Test MongoDB connection
        const mongoService = createMongoDBService();
        
        const startTime = Date.now();
        await mongoService.connect();
        const connectionTime = Date.now() - startTime;
        
        // Test basic operations
        const testStartTime = Date.now();
        const isConnected = await mongoService.testConnection();
        const testTime = Date.now() - testStartTime;
        
        await mongoService.disconnect();

        if (isConnected) {
            healthCheck.status = 'healthy';
            healthCheck.details = {
                connection_time_ms: connectionTime,
                test_time_ms: testTime,
                database: process.env.MONGODB_DATABASE_NAME,
                cluster_reachable: true
            };
            
            console.log('✅ MongoDB Atlas health check passed');
            
            res.status(200).json({
                success: true,
                health: healthCheck
            });
        } else {
            throw new Error('Connection test failed');
        }

    } catch (error) {
        console.error('❌ MongoDB Atlas health check failed:', error.message);
        
        healthCheck.status = 'unhealthy';
        healthCheck.details = {
            error: error.message,
            cluster_reachable: false,
            fallback_mode: true
        };
        
        // Return 200 but with unhealthy status
        // This allows the frontend to handle gracefully
        res.status(200).json({
            success: false,
            health: healthCheck,
            message: 'MongoDB Atlas is currently unavailable'
        });
    }
}
