const { MongoClient } = require('mongodb');

const MONGODB_URI = process.env.MONGODB_URI;
const DB_NAME = process.env.MONGODB_DB_NAME || 'isru-metrics';

let cachedClient = null;

async function connectToDatabase() {
  if (cachedClient) {
    return cachedClient;
  }

  try {
    const client = new MongoClient(MONGODB_URI);
    await client.connect();
    cachedClient = client;
    return client;
  } catch (error) {
    console.error('MongoDB connection error:', error);
    throw error;
  }
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
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const client = await connectToDatabase();
    const db = client.db(DB_NAME);
    const collection = db.collection('marsYardStatus');

    // Aggrega le statistiche per ogni status
    const stats = await collection.aggregate([
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
    ]).toArray();

    const result = stats.length > 0 ? stats[0] : {
      totalUsers: 0,
      waitingRoom: 0,
      checkoutReceived: 0,
      orderShipped: 0,
      orderReceived: 0
    };

    // Rimuovi l'_id dal risultato
    delete result._id;

    console.log('Mars Yard statistics:', result);

    res.status(200).json({
      success: true,
      stats: result
    });

  } catch (error) {
    console.error('Error fetching Mars Yard statistics:', error);
    res.status(500).json({
      error: 'Internal server error',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}
