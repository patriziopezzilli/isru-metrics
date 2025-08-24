// =====================================================
// AUDIT LIST API - Legge audit data da Vercel Blob
// API per ottenere lista audit da Vercel Blob Storage
// =====================================================

import { list } from '@vercel/blob';

export default async function handler(req, res) {
    // Solo GET requests
    if (req.method !== 'GET') {
        return res.status(405).json({ 
            error: 'Method not allowed',
            message: 'Only GET requests are accepted'
        });
    }

    try {
        const { date } = req.query;
        
        if (!date || typeof date !== 'string') {
            return res.status(400).json({
                error: 'Invalid date parameter',
                message: 'Date parameter is required (format: YYYY-MM-DD)'
            });
        }

        console.log(`📋 Listing audits for date: ${date}`);

        // Lista tutti i blob per la data specifica
        const { blobs } = await list({
            prefix: `audit/${date}/`,
            limit: 1000 // Massimo 1000 audit per giorno
        });

        console.log(`📋 Found ${blobs.length} audit files for ${date}`);

        // Estrai informazioni base da ogni blob
        const audits = blobs.map(blob => {
            // Estrai audit_id dal pathname
            const pathParts = blob.pathname.split('/');
            const filename = pathParts[pathParts.length - 1];
            const audit_id = filename.replace('.json', '');
            
            return {
                audit_id,
                url: blob.url,
                uploadedAt: blob.uploadedAt,
                size: blob.size,
                pathname: blob.pathname
            };
        });

        // Ordina per timestamp (più recenti per primi)
        audits.sort((a, b) => new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime());

        res.status(200).json({
            success: true,
            date,
            audit_count: audits.length,
            audits
        });

    } catch (error) {
        console.error('❌ Error listing audits:', error);
        
        res.status(500).json({
            error: 'Internal server error',
            message: 'Failed to list audit data',
            details: error.message
        });
    }
}
