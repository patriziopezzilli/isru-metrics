// =====================================================
// AUDIT DETAILS API - Legge singolo audit da Vercel Blob
// API per ottenere dettagli completi di un audit specifico
// =====================================================

export default async function handler(req, res) {
    // Solo GET requests
    if (req.method !== 'GET') {
        return res.status(405).json({ 
            error: 'Method not allowed',
            message: 'Only GET requests are accepted'
        });
    }

    try {
        const { id, url } = req.query;
        
        if (!id && !url) {
            return res.status(400).json({
                error: 'Missing parameters',
                message: 'Either audit ID or blob URL is required'
            });
        }

        let blobUrl = url;
        
        // Se abbiamo solo l'ID, ricostruisci l'URL
        if (id && !url) {
            // Estrai data dall'audit_id (formato: username_timestamp_random)
            const parts = id.split('_');
            if (parts.length >= 2) {
                const timestamp = parseInt(parts[1]);
                const date = new Date(timestamp).toISOString().split('T')[0];
                blobUrl = `https://blob.vercel-storage.com/audit/${date}/${id}.json`;
            } else {
                return res.status(400).json({
                    error: 'Invalid audit ID format',
                    message: 'Audit ID format should be username_timestamp_random'
                });
            }
        }

        console.log(`📄 Fetching audit details from: ${blobUrl}`);

        // Fetch del blob
        const response = await fetch(blobUrl);
        
        if (!response.ok) {
            throw new Error(`Failed to fetch blob: ${response.status} ${response.statusText}`);
        }

        const auditData = await response.json();

        console.log(`✅ Audit details loaded for: ${auditData.audit_id || id}`);

        res.status(200).json(auditData);

    } catch (error) {
        console.error('❌ Error fetching audit details:', error);
        
        res.status(500).json({
            error: 'Internal server error',
            message: 'Failed to fetch audit details',
            details: error.message
        });
    }
}
