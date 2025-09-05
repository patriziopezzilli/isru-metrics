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
    console.log('Process env NODE_ENV:', process.env.NODE_ENV);
    console.log('MongoDB URI exists:', !!process.env.MONGODB_URI);

    // Crea servizio MongoDB
    console.log('Creating MongoDB service...');
    const mongoService = createMongoDBService();
    console.log('MongoDB service created successfully');
    
    // Connetti al database
    console.log('Connecting to database...');
    await mongoService.connect();
    console.log('Database connection successful');

    console.log('Fetching Mars Yard statistics...');

    // Aggrega le statistiche per ogni status
    const collection = mongoService.db.collection('marsYardStatus');
    console.log('Collection object created:', !!collection);
    
    // Controlla se ci sono documenti nella collezione
    const documentCount = await collection.countDocuments();
    console.log('Total documents in marsYardStatus collection:', documentCount);
    
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

    console.log('Running aggregation pipeline...');
    const stats = await collection.aggregate(pipeline).toArray();
    console.log('Aggregation completed, results:', stats);
    console.log('Stats array length:', stats.length);

    let result;
    if (stats.length > 0) {
      result = stats[0];
      console.log('Using aggregation result:', result);
    } else {
      result = {
        totalUsers: 0,
        waitingRoom: 0,
        checkoutReceived: 0,
        orderShipped: 0,
        orderReceived: 0
      };
      console.log('Using default empty result:', result);
    }

    // Rimuovi l'_id dal risultato se presente
    if (result._id) {
      delete result._id;
    }

    console.log('Final result before sending:', result);

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
