// =====================================================
// AUDIT ENDPOINT - MongoDB Atlas Version
// API endpoint per salvare audit localStorage in MongoDB Atlas
// =====================================================

import { createMongoDBService } from '../src/services/mongodbService.js';

export default async function handler(req, res) {
    // Solo POST requests
    if (req.method !== 'POST') {
        return res.status(405).json({ 
            error: 'Method not allowed',
            message: 'Only POST requests are accepted'
        });
    }

    try {
        console.log('📊 Audit request received for MongoDB Atlas');
        
        // Valida i dati ricevuti
        const auditData = req.body;
        
        if (!auditData || typeof auditData !== 'object') {
            return res.status(400).json({
                error: 'Invalid data',
                message: 'Audit data is required'
            });
        }

        // Crea servizio MongoDB
        const mongoService = createMongoDBService();
        
        // Connetti al database
        await mongoService.connect();

        // Prepara i dati per MongoDB
        const serverTimestamp = new Date();
        const auditId = mongoService.generateAuditId(auditData.username);
        
        const mongoAuditData = {
            audit_id: auditId,
            timestamp: new Date(auditData.timestamp),
            server_timestamp: serverTimestamp,
            username: auditData.username || undefined,
            session_id: auditData.session_id || undefined,
            url: auditData.url,
            user_agent: auditData.user_agent,
            client_ip: getClientIP(req),
            app_version: auditData.app_version || undefined,
            localStorage_data: auditData.localStorage_data || {},
            localStorage_size: auditData.localStorage_size || 0,
            created_at: serverTimestamp,
            date_key: serverTimestamp.toISOString().split('T')[0],
            username_lower: auditData.username?.toLowerCase() || undefined,
            metadata: {
                source: 'isru-metrics-app',
                version: '2.0',
                migration_source: 'direct'
            }
        };

        // Salva in MongoDB
        const insertedId = await mongoService.saveAudit(mongoAuditData);

        console.log('✅ Audit data saved to MongoDB:', {
            audit_id: auditId,
            username: auditData.username,
            timestamp: serverTimestamp.toISOString(),
            localStorage_size: auditData.localStorage_size,
            inserted_id: insertedId
        });

        // Disconnetti (il connection pool gestirà le connessioni)
        await mongoService.disconnect();

        // Risposta di successo
        res.status(200).json({
            success: true,
            message: 'Audit data saved to MongoDB Atlas',
            audit_id: auditId,
            processed_at: serverTimestamp.toISOString(),
            inserted_id: insertedId
        });

    } catch (error) {
        console.error('❌ Audit processing error:', error);

        // Graceful degradation - non bloccare l'utente
        if (error.message.includes('MongoDB') || error.message.includes('connection')) {
            console.warn('⚠️ MongoDB unavailable, audit data lost but user not blocked');

            // Ritorna successo per non bloccare l'utente
            res.status(200).json({
                success: true,
                message: 'Audit service temporarily unavailable',
                audit_id: `fallback_${Date.now()}`,
                processed_at: new Date().toISOString(),
                warning: 'Data not persisted due to service unavailability'
            });
        } else {
            res.status(500).json({
                error: 'Internal server error',
                message: 'Failed to process audit data',
                details: error.message
            });
        }
    }
}

// =====================================================
// HELPER FUNCTIONS
// =====================================================

/**
 * Ottieni IP del client
 */
function getClientIP(req) {
    return req.headers['x-forwarded-for'] ||
           req.headers['x-real-ip'] ||
           req.connection?.remoteAddress ||
           req.socket?.remoteAddress ||
           'unknown';
}
