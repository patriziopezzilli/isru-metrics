// =====================================================
// AUDIT ENDPOINT - Vercel Blob Storage Version
// API endpoint per salvare audit localStorage in Vercel Blob
// =====================================================

import { put } from '@vercel/blob';

export default async function handler(req, res) {
    // Solo POST requests
    if (req.method !== 'POST') {
        return res.status(405).json({ 
            error: 'Method not allowed',
            message: 'Only POST requests are accepted'
        });
    }

    try {
        console.log('📊 Audit request received for Vercel Blob');
        
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
            server_received: true,
            audit_id: generateAuditId(auditData)
        };

        // Salva su Vercel Blob
        await saveToVercelBlob(serverData);

        console.log('✅ Audit data saved to Vercel Blob:', {
            audit_id: serverData.audit_id,
            username: serverData.username,
            timestamp: serverData.timestamp,
            localStorage_size: serverData.localStorage_size,
            keys_count: Object.keys(serverData.localStorage_data || {}).length
        });

        // Risposta di successo
        res.status(200).json({
            success: true,
            message: 'Audit data saved to Vercel Blob',
            audit_id: serverData.audit_id,
            processed_at: serverData.server_timestamp
        });

    } catch (error) {
        console.error('❌ Audit processing error:', error);
        
        res.status(500).json({
            error: 'Internal server error',
            message: 'Failed to process audit data',
            details: error.message
        });
    }
}

// =====================================================
// VERCEL BLOB FUNCTIONS
// =====================================================

/**
 * Salva audit su Vercel Blob Storage
 */
async function saveToVercelBlob(auditData) {
    try {
        // Genera nome file con timestamp e audit_id
        const date = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
        const filename = `audit/${date}/${auditData.audit_id}.json`;
        
        // Converti in JSON
        const jsonData = JSON.stringify(auditData, null, 2);
        
        // Salva su Vercel Blob
        const blob = await put(filename, jsonData, {
            access: 'public', // o 'private' se preferisci
            contentType: 'application/json',
            addRandomSuffix: false // usiamo già audit_id univoco
        });
        
        console.log('📁 Audit saved to Vercel Blob:', {
            url: blob.url,
            pathname: blob.pathname,
            size: jsonData.length
        });
        
        // Opzionale: salva anche un index giornaliero
        await updateDailyIndex(auditData, date);
        
        return blob;
        
    } catch (error) {
        console.error('❌ Failed to save to Vercel Blob:', error);
        throw error;
    }
}

/**
 * Aggiorna indice giornaliero per query rapide
 */
async function updateDailyIndex(auditData, date) {
    try {
        const indexFilename = `audit/index/${date}.json`;
        
        // Crea record per l'indice
        const indexRecord = {
            audit_id: auditData.audit_id,
            timestamp: auditData.server_timestamp,
            username: auditData.username || 'anonymous',
            localStorage_size: auditData.localStorage_size,
            keys_count: Object.keys(auditData.localStorage_data || {}).length,
            url: auditData.url,
            user_agent_short: auditData.user_agent?.substring(0, 50) || 'unknown'
        };
        
        // Per semplicità, ogni audit crea il suo file indice
        // In un sistema più avanzato, potresti concatenare agli indici esistenti
        const indexData = {
            date: date,
            last_updated: new Date().toISOString(),
            audit_count: 1,
            audits: [indexRecord]
        };
        
        await put(indexFilename, JSON.stringify(indexData, null, 2), {
            access: 'public',
            contentType: 'application/json',
            addRandomSuffix: true // Permetti multiple versioni per lo stesso giorno
        });
        
        console.log('📇 Daily index updated for', date);
        
    } catch (error) {
        console.warn('⚠️ Failed to update daily index:', error);
        // Non fallire l'audit principale se l'indice fallisce
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

/**
 * Genera un ID unico per l'audit
 */
function generateAuditId(auditData) {
    const timestamp = Date.now();
    const username = auditData.username || 'anonymous';
    const random = Math.random().toString(36).substr(2, 8);
    
    return `${username}_${timestamp}_${random}`;
}

// =====================================================
// ANALYTICS FUNCTIONS (Opzionali)
// =====================================================

/**
 * Invia metriche di base a Vercel Analytics (se configurato)
 */
async function trackAuditMetrics(auditData) {
    try {
        // Se hai Vercel Analytics configurato
        if (process.env.VERCEL_ANALYTICS_ID) {
            // Questo è solo un esempio - Vercel Analytics è principalmente per frontend
            console.log('📈 Audit metrics tracked:', {
                event: 'localStorage_audit',
                username: auditData.username ? 'logged_in' : 'anonymous',
                localStorage_size_range: getStorageSizeRange(auditData.localStorage_size)
            });
        }
    } catch (error) {
        console.warn('⚠️ Failed to track audit metrics:', error);
    }
}

/**
 * Categorizza la dimensione del localStorage
 */
function getStorageSizeRange(size) {
    if (size < 1000) return 'small';
    if (size < 10000) return 'medium';
    if (size < 50000) return 'large';
    return 'very_large';
}
