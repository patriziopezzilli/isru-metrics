// Unified AUDIT API for MongoDB Atlas
import { createMongoDBService } from '../scripts/mongodbService.js';
import dotenv from 'dotenv';

if (process.env.NODE_ENV !== 'production') {
    dotenv.config({ path: '.env.local' });
}

export default async function handler(req, res) {
    const mongoService = createMongoDBService();
    await mongoService.connect();

    try {
        if (req.method === 'GET') {
            // /api/audit?type=list|details|stats&...params
            const { type } = req.query;
            if (type === 'list') {
                // List audits
                // ...estrai parametri come in audit-list-mongodb.js
                // ...chiama mongoService.listAudits(...)
                // ...restituisci risultato
                // (Copia la logica da audit-list-mongodb.js)
                // ...existing code...
                res.status(200).json({ success: true, data: 'list audits (to implement)' });
            } else if (type === 'details') {
                // Audit details
                // ...estrai parametri come in audit-details-mongodb.js
                // ...chiama mongoService.getAudit(...)
                // ...existing code...
                res.status(200).json({ success: true, data: 'audit details (to implement)' });
            } else if (type === 'stats') {
                // Audit stats
                // ...estrai parametri come in audit-stats-mongodb.js
                // ...chiama mongoService.getAuditStats(...)
                // ...existing code...
                res.status(200).json({ success: true, data: 'audit stats (to implement)' });
            } else {
                res.status(400).json({ error: 'Invalid type parameter' });
            }
        } else if (req.method === 'POST') {
            // Save audit
            // ...copia la logica da audit-mongodb.js
            // ...existing code...
            res.status(200).json({ success: true, data: 'audit saved (to implement)' });
        } else {
            res.status(405).json({ error: 'Method not allowed' });
        }
    } catch (err) {
        res.status(500).json({ error: 'Database error', details: err.message });
    } finally {
        await mongoService.disconnect();
    }
}
