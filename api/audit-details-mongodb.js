// =====================================================
// AUDIT DETAILS ENDPOINT - MongoDB Atlas Version
// API endpoint per ottenere dettagli audit da MongoDB Atlas
// =====================================================

import { createMongoDBService } from '../scripts/mongodbService.js';
import dotenv from 'dotenv';

// Load environment variables in development
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

    try {
        console.log('🔍 Audit details request received for MongoDB Atlas');
        
        // Estrai parametri
        const { audit_id } = req.query;
        
        if (!audit_id) {
            return res.status(400).json({
                error: 'Missing parameters',
                message: 'audit_id parameter is required'
            });
        }

        // Crea servizio MongoDB
        const mongoService = createMongoDBService();
        
        // Connetti al database
        await mongoService.connect();

        // Cerca l'audit
        const audit = await mongoService.getAudit(audit_id);

        if (!audit) {
            await mongoService.disconnect();
            return res.status(404).json({
                error: 'Audit not found',
                message: `No audit found with ID: ${audit_id}`
            });
        }

        console.log('✅ Audit details retrieved from MongoDB:', {
            audit_id: audit.audit_id,
            username: audit.username,
            created_at: audit.created_at
        });

        // Disconnetti
        await mongoService.disconnect();

        // Risposta di successo
        res.status(200).json({
            success: true,
            data: audit,
            retrieved_at: new Date().toISOString()
        });

    } catch (error) {
        console.error('❌ Audit details error:', error);
        
        res.status(500).json({
            error: 'Internal server error',
            message: 'Failed to retrieve audit details',
            details: error.message
        });
    }
}
