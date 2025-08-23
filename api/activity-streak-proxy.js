/**
 * Activity Streak API Proxy
 * 
 * Proxy specifico per gestire le chiamate all'API di streak delle attività
 * con gestione ottimizzata dei parametri di query
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

  // Estrai e valida parametri
  const { username, activity_id } = req.query;
  
  if (!username || !activity_id) {
    res.status(400).json({ 
      error: 'Missing required parameters',
      required: ['username', 'activity_id'],
      received: { username: !!username, activity_id: !!activity_id }
    });
    return;
  }

  // Costruisci URL target
  const targetUrl = `https://isrucamp.com/api/activities/activity-participations/user_activity_participation/?username=${encodeURIComponent(username)}&activity_id=${activity_id}`;

  try {
    console.log(`🔥 Activity Streak Proxy: Fetching streak for ${username}, activity ${activity_id}`);
    
    const response = await fetch(targetUrl, {
      method: 'GET',
      headers: {
        'User-Agent': 'ISRU-League-Activity-Streak-Proxy/1.0',
        'Accept': 'application/json',
      },
      signal: AbortSignal.timeout(8000) // 8 secondi timeout
    });

    if (!response.ok) {
      console.error(`❌ Activity Streak API error: ${response.status} ${response.statusText}`);
      
      // Fornisci errori specifici
      if (response.status === 404) {
        res.status(404).json({ 
          error: 'Activity streak data not found',
          username,
          activity_id,
          status: 404 
        });
      } else if (response.status === 400) {
        res.status(400).json({ 
          error: 'Invalid parameters for activity streak API',
          username,
          activity_id,
          status: 400 
        });
      } else {
        res.status(response.status).json({ 
          error: `Activity streak API returned ${response.status}`,
          status: response.status 
        });
      }
      return;
    }

    const data = await response.json();
    
    // Validazione base della risposta
    if (!data || typeof data !== 'object') {
      console.error('❌ Invalid activity streak data structure');
      res.status(500).json({ error: 'Invalid activity streak data structure' });
      return;
    }
    
    console.log(`✅ Activity Streak Proxy: Successfully fetched streak for ${username}, activity ${activity_id}`);
    
    // Aggiungi metadata del proxy
    const responseData = {
      ...data,
      _proxy: {
        timestamp: new Date().toISOString(),
        source: 'isru-league-activity-streak-proxy',
        version: '1.0',
        username,
        activity_id: parseInt(activity_id)
      }
    };

    res.status(200).json(responseData);

  } catch (error) {
    console.error(`❌ Activity Streak Proxy error for ${username}, activity ${activity_id}:`, error);
    
    // Gestisci diversi tipi di errore
    if (error.name === 'AbortError') {
      res.status(408).json({ 
        error: 'Activity streak request timeout',
        username,
        activity_id 
      });
    } else if (error.name === 'TypeError' && error.message.includes('fetch')) {
      res.status(503).json({ 
        error: 'Activity streak service unavailable',
        username,
        activity_id 
      });
    } else {
      res.status(500).json({ 
        error: 'Internal activity streak proxy error',
        message: error.message,
        username,
        activity_id 
      });
    }
  }
}
