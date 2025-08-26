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
                const { username, date_from, date_to, limit, skip, sort } = req.query;
                const options = {
                    username,
                    date_from: date_from ? new Date(date_from) : undefined,
                    date_to: date_to ? new Date(date_to) : undefined,
                    limit: limit ? parseInt(limit) : 50,
                    skip: skip ? parseInt(skip) : 0,
                    sort: sort ? JSON.parse(sort) : undefined
                };
                const result = await mongoService.listAudits(options);
                res.status(200).json({ success: true, ...result });
            } else if (type === 'details') {
                // Audit details
                const { audit_id } = req.query;
                if (!audit_id) {
                    return res.status(400).json({ error: 'Missing audit_id' });
                }
                const audit = await mongoService.getAudit(audit_id);
                if (!audit) {
                    return res.status(404).json({ error: 'Audit not found' });
                }
                res.status(200).json({ success: true, audit });
            } else if (type === 'stats') {
                // Audit stats
                const { date_from, date_to } = req.query;
                const stats = await mongoService.getAuditStats(date_from ? new Date(date_from) : undefined, date_to ? new Date(date_to) : undefined);
                res.status(200).json({ success: true, stats });
            } else {
                res.status(400).json({ error: 'Invalid type parameter' });
            }
        } else if (req.method === 'POST') {
            // Save audit
            const auditData = req.body;
            if (!auditData || typeof auditData !== 'object') {
                return res.status(400).json({ error: 'Missing or invalid audit data' });
            }
            const insertedId = await mongoService.saveAudit(auditData);
            res.status(200).json({ success: true, insertedId });
        } else {
            res.status(405).json({ error: 'Method not allowed' });
        }
    } catch (err) {
        res.status(500).json({ error: 'Database error', details: err.message });
    } finally {
        await mongoService.disconnect();
    }
}
