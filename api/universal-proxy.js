/**
 * Universal API Proxy
 * 
 * Questo proxy unificato gestisce tutte le chiamate API esterne
 * evitando i problemi CORS e centralizzando la gestione.
 */

export default async function handler(req, res) {
  // Imposta gli header CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Cache-Control', 'public, max-age=120'); // Cache per 2 minuti

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

  // Estrai parametri
  const { api, username } = req.query;
  
  let targetUrl = '';
  let timeoutMs = 10000; // Default 10 secondi
  
  // Determina l'URL target basato sul tipo di API
  switch (api) {
    case 'isru-leaderboard':
      targetUrl = 'https://isrucamp.com/api/users/leaderboard/score-distribution/?preload_users=true';
      timeoutMs = 10000;
      break;
      
    case 'sneakerdb-profile':
      if (!username) {
        res.status(400).json({ error: 'Username parameter is required for SneakerDB API' });
        return;
      }
      targetUrl = `https://tools.sneakerdb.net/api/isrucamp-user-profile/${username}`;
      timeoutMs = 15000; // SneakerDB può essere più lento
      break;
      
    default:
      res.status(400).json({ 
        error: 'Invalid API type',
        supportedApis: ['isru-leaderboard', 'sneakerdb-profile'] 
      });
      return;
  }

  try {
    console.log(`🔄 Universal Proxy: Fetching ${api}${username ? ` for ${username}` : ''}`);
    
    const response = await fetch(targetUrl, {
      method: 'GET',
      headers: {
        'User-Agent': 'ISRU-League-Universal-Proxy/1.0',
        'Accept': 'application/json',
      },
      signal: AbortSignal.timeout(timeoutMs)
    });

    if (!response.ok) {
      console.error(`❌ ${api} API error: ${response.status} ${response.statusText}`);
      
      if (response.status === 404) {
        res.status(404).json({ 
          error: `Resource not found for ${api}`,
          status: 404 
        });
      } else {
        res.status(response.status).json({ 
          error: `${api} API returned ${response.status}`,
          status: response.status 
        });
      }
      return;
    }

    const data = await response.json();
    
    // Validazione specifica per tipo di API
    if (api === 'isru-leaderboard' && !data.scoreDistribution) {
      console.error('❌ Invalid ISRU leaderboard data structure');
      res.status(500).json({ error: 'Invalid ISRU leaderboard data structure' });
      return;
    }
    
    console.log(`✅ Universal Proxy: Successfully fetched ${api}${username ? ` for ${username}` : ''}`);
    
    // Aggiungi metadata del proxy
    const responseData = {
      ...data,
      _proxy: {
        timestamp: new Date().toISOString(),
        source: 'isru-league-universal-proxy',
        version: '1.0',
        api: api,
        ...(username && { username })
      }
    };

    res.status(200).json(responseData);

  } catch (error) {
    console.error(`❌ Universal Proxy error for ${api}:`, error);
    
    // Gestisci diversi tipi di errore
    if (error.name === 'AbortError') {
      res.status(408).json({ error: 'Request timeout' });
    } else if (error.name === 'TypeError' && error.message.includes('fetch')) {
      res.status(503).json({ error: `${api} service unavailable` });
    } else {
      res.status(500).json({ 
        error: 'Internal proxy error',
        message: error.message 
      });
    }
  }
}
