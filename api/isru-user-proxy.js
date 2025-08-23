/**
 * ISRU User Profile API Proxy
 * 
 * Proxy specifico per gestire le chiamate all'API dei profili utente ISRU
 * con gestione ottimizzata e validazione dei dati
 */

export default async function handler(req, res) {
  // Imposta gli header CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Cache-Control', 'public, max-age=60'); // Cache per 1 minuto

  // Gestisci preflight OPTIONS
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  // Solo GET è permesso
  if (req.method !== 'GET') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  // Estrai e valida parametri
  const { username } = req.query;
  
  if (!username) {
    res.status(400).json({ 
      error: 'Missing required parameter',
      required: ['username'],
      received: { username: !!username }
    });
    return;
  }

  // Costruisci URL target
  const targetUrl = `https://isrucamp.com/api/users/users/profile/${encodeURIComponent(username)}`;

  try {
    console.log(`👤 ISRU User Profile Proxy: Fetching profile for ${username}`);
    
    const response = await fetch(targetUrl, {
      method: 'GET',
      headers: {
        'User-Agent': 'ISRU-League-User-Profile-Proxy/1.0',
        'Accept': 'application/json',
      },
      signal: AbortSignal.timeout(8000) // 8 secondi timeout
    });

    if (!response.ok) {
      console.error(`❌ ISRU User Profile API error: ${response.status} ${response.statusText}`);
      
      // Fornisci errori specifici
      if (response.status === 404) {
        res.status(404).json({ 
          error: 'User profile not found',
          username,
          status: 404 
        });
      } else if (response.status === 400) {
        res.status(400).json({ 
          error: 'Invalid username for ISRU user profile API',
          username,
          status: 400 
        });
      } else {
        res.status(response.status).json({ 
          error: `ISRU user profile API returned ${response.status}`,
          status: response.status 
        });
      }
      return;
    }

    const data = await response.json();
    
    // Validazione della struttura dati
    if (!data || typeof data !== 'object' || !data.user || typeof data.user !== 'object') {
      console.error('❌ Invalid ISRU user profile data structure:', { 
        hasData: !!data, 
        hasUser: !!(data && data.user),
        userType: data && typeof data.user
      });
      res.status(500).json({ error: 'Invalid ISRU user profile data structure' });
      return;
    }
    
    console.log(`✅ ISRU User Profile Proxy: Successfully fetched profile for ${username}`);
    
    // Aggiungi metadata del proxy
    const responseData = {
      ...data,
      _proxy: {
        timestamp: new Date().toISOString(),
        source: 'isru-league-user-profile-proxy',
        version: '1.0',
        username
      }
    };

    res.status(200).json(responseData);

  } catch (error) {
    console.error(`❌ ISRU User Profile Proxy error for ${username}:`, error);
    
    // Gestisci diversi tipi di errore
    if (error.name === 'AbortError') {
      res.status(408).json({ 
        error: 'ISRU user profile request timeout',
        username
      });
    } else if (error.name === 'TypeError' && error.message.includes('fetch')) {
      res.status(503).json({ 
        error: 'ISRU user profile service unavailable',
        username
      });
    } else {
      res.status(500).json({ 
        error: 'Internal ISRU user profile proxy error',
        message: error.message,
        username
      });
    }
  }
}
