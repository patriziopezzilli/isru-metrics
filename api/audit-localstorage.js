// =====================================================
// AUDIT ENDPOINT - Riceve dati localStorage per audit
// API endpoint per ricevere e salvare dati audit del localStorage
// =====================================================

export default async function handler(req, res) {
    // Solo POST requests
    if (req.method !== 'POST') {
        return res.status(405).json({ 
            error: 'Method not allowed',
            message: 'Only POST requests are accepted'
        });
    }

    try {
        console.log('📊 Audit request received');
        
        // Valida i dati ricevuti
        const auditData = req.body;
        
        if (!auditData || typeof auditData !== 'object') {
            return res.status(400).json({
                error: 'Invalid data',
                message: 'Audit data is required'
            });
        }

        // Aggiungi metadata del server
        const serverData = {
            ...auditData,
            server_timestamp: new Date().toISOString(),
            client_ip: getClientIP(req),
            server_received: true
        };

        // In un vero setup, qui invieresti al database
        // Per ora logga e salva in un sistema di cache temporaneo
        await saveAuditData(serverData);

        console.log('✅ Audit data processed:', {
            username: serverData.username,
            timestamp: serverData.timestamp,
            localStorage_size: serverData.localStorage_size,
            keys_count: Object.keys(serverData.localStorage_data || {}).length
        });

        // Risposta di successo
        res.status(200).json({
            success: true,
            message: 'Audit data received',
            audit_id: generateAuditId(serverData),
            processed_at: serverData.server_timestamp
        });

    } catch (error) {
        console.error('❌ Audit processing error:', error);
        
        res.status(500).json({
            error: 'Internal server error',
            message: 'Failed to process audit data'
        });
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
           req.connection.remoteAddress ||
           req.socket.remoteAddress ||
           (req.connection.socket ? req.connection.socket.remoteAddress : null) ||
           'unknown';
}

/**
 * Genera un ID unico per l'audit
 */
function generateAuditId(auditData) {
    const timestamp = Date.now();
    const username = auditData.username || 'anonymous';
    const random = Math.random().toString(36).substr(2, 6);
    
    return `audit_${username}_${timestamp}_${random}`;
}

/**
 * Salva i dati di audit
 * In produzione, questo invierebbe al database PostgreSQL
 */
async function saveAuditData(auditData) {
    try {
        // OPZIONE 1: Log dettagliato per debug
        console.log('📊 === AUDIT DATA RECEIVED ===');
        console.log('User:', auditData.username || 'anonymous');
        console.log('Timestamp:', auditData.timestamp);
        console.log('URL:', auditData.url);
        console.log('localStorage size:', auditData.localStorage_size);
        console.log('Data keys:', Object.keys(auditData.localStorage_data || {}));
        
        // OPZIONE 2: Salva in file JSON temporaneo (per sviluppo)
        if (process.env.NODE_ENV === 'development') {
            await saveToTempFile(auditData);
        }
        
        // OPZIONE 3: Invia al database (quando ready)
        if (process.env.DATABASE_URL) {
            await saveToDatabase(auditData);
        }
        
        // OPZIONE 4: Invia a servizio esterno (es. analytics)
        if (process.env.ANALYTICS_WEBHOOK_URL) {
            await sendToAnalytics(auditData);
        }
        
    } catch (error) {
        console.error('Failed to save audit data:', error);
        // Non propagare l'errore - l'audit non deve bloccare l'app
    }
}

/**
 * Salva in file temporaneo per sviluppo
 */
async function saveToTempFile(auditData) {
    try {
        const fs = require('fs').promises;
        const path = require('path');
        
        // Crea directory audit se non esiste
        const auditDir = path.join(process.cwd(), 'audit-logs');
        try {
            await fs.mkdir(auditDir, { recursive: true });
        } catch (e) {
            // Directory già esiste
        }
        
        // Nome file con timestamp
        const filename = `audit_${new Date().toISOString().split('T')[0]}.jsonl`;
        const filepath = path.join(auditDir, filename);
        
        // Aggiungi linea JSONL (JSON Lines)
        const logLine = JSON.stringify(auditData) + '\n';
        await fs.appendFile(filepath, logLine);
        
        console.log(`📄 Audit saved to: ${filepath}`);
        
    } catch (error) {
        console.warn('Failed to save audit to file:', error);
    }
}

/**
 * Salva nel database PostgreSQL
 */
async function saveToDatabase(auditData) {
    try {
        const { Client } = require('pg');
        const client = new Client({ 
            connectionString: process.env.DATABASE_URL,
            ssl: process.env.DATABASE_URL?.includes('localhost') ? false : { rejectUnauthorized: false }
        });
        
        await client.connect();
        
        const query = `
            INSERT INTO audit_localstorage (
                client_timestamp, server_timestamp, username, session_id,
                url, user_agent, client_ip, app_version,
                localStorage_data, localStorage_size
            ) VALUES (
                $1, $2, $3, $4, $5, $6, $7, $8, $9, $10
            )
        `;
        
        await client.query(query, [
            auditData.timestamp,
            auditData.server_timestamp,
            auditData.username || null,
            auditData.session_id,
            auditData.url,
            auditData.user_agent,
            auditData.client_ip,
            auditData.app_version || null,
            JSON.stringify(auditData.localStorage_data),
            auditData.localStorage_size
        ]);
        
        await client.end();
        
        console.log('💾 Audit saved to database');
        
    } catch (error) {
        console.warn('Failed to save audit to database:', error);
    }
}

/**
 * Invia a servizio analytics esterno
 */
async function sendToAnalytics(auditData) {
    try {
        const webhookUrl = process.env.ANALYTICS_WEBHOOK_URL;
        
        const response = await fetch(webhookUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${process.env.ANALYTICS_API_KEY || ''}`
            },
            body: JSON.stringify({
                event: 'localStorage_audit',
                timestamp: auditData.server_timestamp,
                user: auditData.username,
                properties: {
                    localStorage_size: auditData.localStorage_size,
                    keys_count: Object.keys(auditData.localStorage_data || {}).length,
                    url: auditData.url,
                    app_version: auditData.app_version
                }
            })
        });
        
        if (response.ok) {
            console.log('📈 Audit sent to analytics');
        } else {
            throw new Error(`Analytics API error: ${response.status}`);
        }
        
    } catch (error) {
        console.warn('Failed to send audit to analytics:', error);
    }
}
