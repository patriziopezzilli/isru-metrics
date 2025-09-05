// =====================================================
// MARS YARD STATS ENDPOINT - MongoDB Atlas Version
// API endpoint per recuperare statistiche Mars Yard da MongoDB Atlas
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
    console.log('📊 Mars Yard stats request received');

    // Crea servizio MongoDB
    const mongoService = createMongoDBService();
    
    // Connetti al database
    await mongoService.connect();

    console.log('Fetching Mars Yard statistics...');

    // Aggrega le statistiche per ogni status
    const pipeline = [
      {
        $group: {
          _id: null,
          totalUsers: { $sum: 1 },
          waitingRoom: {
            $sum: { $cond: [{ $eq: ["$status.waitingRoom", true] }, 1, 0] }
          },
          checkoutReceived: {
            $sum: { $cond: [{ $eq: ["$status.checkoutReceived", true] }, 1, 0] }
          },
          orderShipped: {
            $sum: { $cond: [{ $eq: ["$status.orderShipped", true] }, 1, 0] }
          },
          orderReceived: {
            $sum: { $cond: [{ $eq: ["$status.orderReceived", true] }, 1, 0] }
          }
        }
      }
    ];

    const stats = await mongoService.aggregate('marsYardStatus', pipeline);

    const result = stats.length > 0 ? stats[0] : {
      totalUsers: 0,
      waitingRoom: 0,
      checkoutReceived: 0,
      orderShipped: 0,
      orderReceived: 0
    };

    // Rimuovi l'_id dal risultato
    delete result._id;

    // Disconnetti dopo l'operazione
    await mongoService.disconnect();

    console.log('✅ Mars Yard statistics retrieved:', result);

    res.status(200).json({
      success: true,
      stats: result
    });

  } catch (error) {
    console.error('❌ Error fetching Mars Yard statistics:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to fetch Mars Yard statistics',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}
