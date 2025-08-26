
import { createMongoDBService } from '../scripts/mongodbService.js';
import dotenv from 'dotenv';

if (process.env.NODE_ENV !== 'production') {
  dotenv.config({ path: '.env.local' });
}

export default async function handler(req, res) {
  try {
    const mongoService = createMongoDBService();
    await mongoService.connect();
    const collection = mongoService.db.collection('user_shoes');

    if (req.method === 'POST') {
      const { username, shoeType, imageBase64 } = req.body;
      if (!username || !shoeType || !imageBase64) {
        await mongoService.disconnect();
        return res.status(400).json({ error: 'Missing fields' });
      }
      await collection.insertOne({ username, shoeType, imageBase64, createdAt: new Date() });
      await mongoService.disconnect();
      return res.status(200).json({ success: true });
    }

    if (req.method === 'GET') {
      const shoes = await collection.find({}, { projection: { imageBase64: 1, username: 1, shoeType: 1, createdAt: 1 } }).sort({ createdAt: -1 }).toArray();
      await mongoService.disconnect();
      return res.status(200).json({ shoes });
    }

    await mongoService.disconnect();
    return res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    res.status(500).json({ error: 'Database error', details: err.message });
  }
}
