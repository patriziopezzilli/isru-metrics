/**
 * SneakerDB API Proxy
 * 
 * Questo proxy aggira i problemi CORS per l'API SneakerDB
 * che fornisce i profili utente ISRU.
 */

export default async function handler(req, res) {
  // Imposta gli header CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Cache-Control', 'public, max-age=300'); // Cache per 5 minuti

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

  // Estrai username dai query parameters
  const { username } = req.query;
  
  if (!username) {
    res.status(400).json({ error: 'Username parameter is required' });
    return;
  }

  try {
    console.log(`👤 SneakerDB Proxy: Fetching profile for user: ${username}`);
    
    // Chiamata diretta all'API SneakerDB
    const apiUrl = `https://tools.sneakerdb.net/api/isrucamp-user-profile/${username}`;
    
    const response = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        'User-Agent': 'ISRU-League-Proxy/1.0',
        'Accept': 'application/json',
      },
      // Timeout di 15 secondi per SneakerDB (può essere più lento)
      signal: AbortSignal.timeout(15000)
    });

    if (!response.ok) {
      console.error(`❌ SneakerDB API error: ${response.status} ${response.statusText}`);
      
      if (response.status === 404) {
        res.status(404).json({ 
          error: `User '${username}' not found in SneakerDB`,
          status: 404 
        });
      } else {
        res.status(response.status).json({ 
          error: `SneakerDB API returned ${response.status}`,
          status: response.status 
        });
      }
      return;
    }

    const data = await response.json();
    
    console.log(`✅ SneakerDB Proxy: Successfully fetched profile for ${username}`);
    
    // Aggiungi metadata del proxy
    const responseData = {
      ...data,
      _proxy: {
        timestamp: new Date().toISOString(),
        source: 'isru-league-sneakerdb-proxy',
        version: '1.0',
        username: username
      }
    };

    res.status(200).json(responseData);

  } catch (error) {
    console.error(`❌ SneakerDB Proxy error for ${username}:`, error);
    
    // Gestisci diversi tipi di errore
    if (error.name === 'AbortError') {
      res.status(408).json({ error: 'Request timeout' });
    } else if (error.name === 'TypeError' && error.message.includes('fetch')) {
      res.status(503).json({ error: 'SneakerDB service unavailable' });
    } else {
      res.status(500).json({ 
        error: 'Internal proxy error',
        message: error.message 
      });
    }
  }
}
