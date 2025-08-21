/**
 * ISRU League API Proxy
 * 
 * Questo proxy aggira i problemi CORS chiamando direttamente l'API ISRU
 * e aggiungendo gli header necessari per permettere l'accesso dal frontend.
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

  try {
    console.log('📡 Proxy: Fetching data from ISRU API...');
    
    // Chiamata diretta all'API ISRU (senza restrizioni CORS lato server)
    const apiUrl = 'https://isrucamp.com/api/users/leaderboard/score-distribution/?preload_users=true';
    
    const response = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        'User-Agent': 'ISRU-League-Proxy/1.0',
        'Accept': 'application/json',
      },
      // Timeout di 10 secondi
      signal: AbortSignal.timeout(10000)
    });

    if (!response.ok) {
      console.error(`❌ ISRU API error: ${response.status} ${response.statusText}`);
      res.status(response.status).json({ 
        error: `ISRU API returned ${response.status}`,
        status: response.status 
      });
      return;
    }

    const data = await response.json();
    
    // Validazione base dei dati
    if (!data || !data.scoreDistribution) {
      console.error('❌ Invalid data structure from ISRU API');
      res.status(500).json({ error: 'Invalid data structure from ISRU API' });
      return;
    }

    console.log(`✅ Proxy: Successfully fetched ${data.scoreDistribution.length} score entries`);
    
    // Aggiungi metadata del proxy
    const responseData = {
      ...data,
      _proxy: {
        timestamp: new Date().toISOString(),
        source: 'isru-league-proxy',
        version: '1.0'
      }
    };

    res.status(200).json(responseData);

  } catch (error) {
    console.error('❌ Proxy error:', error);
    
    // Gestisci diversi tipi di errore
    if (error.name === 'AbortError') {
      res.status(408).json({ error: 'Request timeout' });
    } else if (error.name === 'TypeError' && error.message.includes('fetch')) {
      res.status(503).json({ error: 'Service unavailable - network error' });
    } else {
      res.status(500).json({ 
        error: 'Internal proxy error',
        message: error.message 
      });
    }
  }
}
