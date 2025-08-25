// =====================================================
// AUDIT LIST ENDPOINT - MongoDB Atlas Version
// API endpoint per listare audit localStorage da MongoDB Atlas
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
        console.log('📋 Audit list request received for MongoDB Atlas');
        
        // Estrai parametri query
        const {
            username,
            date,
            date_from,
            date_to,
            page = '1',
            limit = '50'
        } = req.query;

        // Valida e converte parametri
        const pageNum = Math.max(1, parseInt(page) || 1);
        const limitNum = Math.min(100, Math.max(1, parseInt(limit) || 50)); // Max 100 per page
        const skip = (pageNum - 1) * limitNum;

        // Crea servizio MongoDB
        const mongoService = createMongoDBService();
        
        // Connetti al database
        await mongoService.connect();

        // Prepara opzioni query
        const queryOptions = {
            skip,
            limit: limitNum,
            sort: { created_at: -1 } // Newest first
        };

        // Aggiungi filtri
        if (username) {
            queryOptions.username = username;
        }

        if (date) {
            queryOptions.date_key = date;
        }

        if (date_from || date_to) {
            if (date_from) {
                queryOptions.date_from = new Date(date_from);
            }
            if (date_to) {
                queryOptions.date_to = new Date(date_to);
            }
        }

        // Esegui query
        const result = await mongoService.listAudits(queryOptions);

        console.log('✅ Audit list retrieved from MongoDB:', {
            total: result.total,
            page: result.page,
            limit: result.limit,
            returned: result.audits.length
        });

        // Disconnetti
        await mongoService.disconnect();

        // Risposta di successo
        res.status(200).json({
            success: true,
            data: result,
            query_params: {
                username,
                date,
                date_from,
                date_to,
                page: pageNum,
                limit: limitNum
            },
            retrieved_at: new Date().toISOString()
        });

    } catch (error) {
        console.error('❌ Audit list error:', error);

        // Graceful degradation
        if (error.message.includes('MongoDB') || error.message.includes('connection')) {
            console.warn('⚠️ MongoDB unavailable, returning empty list');

            res.status(200).json({
                success: true,
                data: {
                    audits: [],
                    total: 0,
                    page: 1,
                    limit: 50,
                    has_more: false
                },
                warning: 'Audit service temporarily unavailable',
                retrieved_at: new Date().toISOString()
            });
        } else {
            res.status(500).json({
                error: 'Internal server error',
                message: 'Failed to retrieve audit list',
                details: error.message
            });
        }
    }
}
