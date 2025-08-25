// =====================================================
// AUDIT STATS ENDPOINT - MongoDB Atlas Version
// API endpoint per ottenere statistiche audit da MongoDB Atlas
// =====================================================

import { createMongoDBService } from '../src/services/mongodbService.js';

export default async function handler(req, res) {
    // Solo GET requests
    if (req.method !== 'GET') {
        return res.status(405).json({ 
            error: 'Method not allowed',
            message: 'Only GET requests are accepted'
        });
    }

    try {
        console.log('📊 Audit stats request received for MongoDB Atlas');
        
        // Estrai parametri query opzionali
        const { date_from, date_to } = req.query;

        // Crea servizio MongoDB
        const mongoService = createMongoDBService();
        
        // Connetti al database
        await mongoService.connect();

        // Prepara filtri data
        let dateFrom, dateTo;
        if (date_from) {
            dateFrom = new Date(date_from);
        }
        if (date_to) {
            dateTo = new Date(date_to);
        }

        // Ottieni statistiche
        const stats = await mongoService.getAuditStats(dateFrom, dateTo);

        console.log('✅ Audit stats retrieved from MongoDB:', {
            total_audits: stats.total_audits,
            unique_users: stats.unique_users,
            date_range: stats.date_range
        });

        // Disconnetti
        await mongoService.disconnect();

        // Risposta di successo
        res.status(200).json({
            success: true,
            data: stats,
            filters: {
                date_from: date_from || null,
                date_to: date_to || null
            },
            retrieved_at: new Date().toISOString()
        });

    } catch (error) {
        console.error('❌ Audit stats error:', error);
        
        res.status(500).json({
            error: 'Internal server error',
            message: 'Failed to retrieve audit statistics',
            details: error.message
        });
    }
}
