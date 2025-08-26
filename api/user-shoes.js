const { MongoClient } = require('mongodb');

const uri = process.env.MONGODB_URI;
const dbName = process.env.MONGODB_DB || 'isru-metrics';

module.exports = async (req, res) => {
  let client;
  try {
    client = await MongoClient.connect(uri, { useNewUrlParser: true, useUnifiedTopology: true });
    const db = client.db(dbName);
    const collection = db.collection('user_shoes');

    if (req.method === 'POST') {
      // Upload photo
      const { username, shoeType, imageBase64 } = req.body;
      if (!username || !shoeType || !imageBase64) {
        return res.status(400).json({ error: 'Missing fields' });
      }
      await collection.insertOne({ username, shoeType, imageBase64, createdAt: new Date() });
      return res.status(200).json({ success: true });
    }

    if (req.method === 'GET') {
      // List photos
      const shoes = await collection.find({}, { projection: { imageBase64: 1, username: 1, shoeType: 1, createdAt: 1 } }).sort({ createdAt: -1 }).toArray();
      return res.status(200).json({ shoes });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    res.status(500).json({ error: 'Database error', details: err.message });
  } finally {
    if (client) await client.close();
  }
};
