// =====================================================
// MARS YARD USER STATUS ENDPOINT - MongoDB Atlas Version
// API endpoint per verificare se un utente ha status Mars Yard
// =====================================================

import { createMongoDBService } from '../scripts/mongodbService.js';
import dotenv from 'dotenv';

// Load environment variables in development
if (process.env.NODE_ENV !== 'production') {
    dotenv.config({ path: '.env.local' });
}

export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ 
      error: 'Method not allowed',
      message: 'Only GET requests are accepted'
    });
  }

  try {
    const { username } = req.query;

    if (!username) {
      return res.status(400).json({ 
        error: 'Username parameter is required',
        message: 'Please provide a username query parameter'
      });
    }

    console.log(`🔍 Checking Mars Yard status for user: ${username}`);

    // Crea servizio MongoDB
    const mongoService = createMongoDBService();
    
    // Connetti al database
    await mongoService.connect();

    // Cerca l'utente nel database
    const userStatus = await mongoService.findDocument(
      'marsYardStatus', 
      { username_lower: username.toLowerCase() }
    );

    // Disconnetti dopo l'operazione
    await mongoService.disconnect();

    if (!userStatus) {
      console.log(`❌ User ${username} not found in Mars Yard status collection`);
      return res.status(404).json({ 
        error: 'User not found',
        message: 'No Mars Yard status data found for this user'
      });
    }

    console.log(`✅ Mars Yard status found for user ${username}`);

    res.status(200).json({ 
      success: true, 
      status: userStatus.status,
      lastUpdated: userStatus.last_updated,
      createdAt: userStatus.created_at
    });

  } catch (error) {
    console.error('❌ Error checking user Mars Yard status:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      message: 'Failed to check user Mars Yard status',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}
