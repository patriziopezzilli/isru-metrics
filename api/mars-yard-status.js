// =====================================================
// MARS YARD STATUS ENDPOINT - MongoDB Atlas Version
// API endpoint per salvare Mars Yard status in MongoDB Atlas
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

  if (req.method !== 'POST') {
    return res.status(405).json({ 
      error: 'Method not allowed',
      message: 'Only POST requests are accepted'
    });
  }

  try {
    console.log('🚀 Mars Yard status request received');
    
    const { username, status, timestamp } = req.body;

    console.log('Mars Yard API received:', {
      username,
      status,
      timestamp,
      bodyKeys: Object.keys(req.body || {})
    });

    if (!username || !status || !timestamp) {
      return res.status(400).json({
        error: 'Missing required fields',
        message: 'username, status, and timestamp are required'
      });
    }

    // Validazione aggiuntiva per il campo status
    if (typeof status !== 'object' || status === null) {
      return res.status(400).json({
        error: 'Invalid status object',
        message: 'Status must be a valid object'
      });
    }

    // Crea servizio MongoDB
    const mongoService = createMongoDBService();
    
    // Connetti al database
    await mongoService.connect();

    // Prepara i dati per MongoDB
    const serverTimestamp = new Date();
    const statusId = `mars_yard_${username}_${Date.now()}`;
    
    const mongoStatusData = {
      status_id: statusId,
      username: username,
      username_lower: username.toLowerCase(),
      status: status,
      timestamp: timestamp,
      server_timestamp: serverTimestamp,
      created_at: serverTimestamp,
      last_updated: serverTimestamp
    };

    console.log('Saving Mars Yard status to MongoDB...');

    // Upsert: aggiorna se esiste, crea se non esiste
    const result = await mongoService.upsertDocument(
      'marsYardStatus',
      { username_lower: username.toLowerCase() },
      {
        $set: {
          username: username,
          username_lower: username.toLowerCase(),
          status: status,
          timestamp: timestamp,
          server_timestamp: serverTimestamp,
          last_updated: serverTimestamp
        },
        $setOnInsert: {
          status_id: statusId,
          created_at: serverTimestamp
        }
      }
    );

    console.log('Mars Yard status operation result:', {
      acknowledged: result.acknowledged,
      matchedCount: result.matchedCount,
      modifiedCount: result.modifiedCount,
      upsertedCount: result.upsertedCount
    });

    // Disconnetti dopo l'operazione
    await mongoService.disconnect();

    console.log(`✅ Mars Yard status saved successfully for user ${username}`);

    res.status(200).json({ 
      success: true, 
      message: 'Mars Yard status saved successfully',
      upserted: result.upsertedCount > 0,
      modified: result.modifiedCount > 0
    });

  } catch (error) {
    console.error('❌ Error saving Mars Yard status:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      message: 'Failed to save Mars Yard status',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}
