
import { createMongoDBService } from '../scripts/mongodbService.js';
import dotenv from 'dotenv';

if (process.env.NODE_ENV !== 'production') {
  dotenv.config({ path: '.env.local' });
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { message } = req.body;
  if (!message || typeof message !== 'string') {
    return res.status(400).json({ error: 'Message required' });
  }

  try {
    const mongoService = createMongoDBService();
    await mongoService.connect();
    await mongoService.db.collection('feedback').insertOne({ message, createdAt: new Date() });
    await mongoService.disconnect();
    res.status(200).json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Database error', details: err.message });
  }
}
