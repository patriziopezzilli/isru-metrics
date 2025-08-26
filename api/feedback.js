const { MongoClient } = require('mongodb');

const uri = process.env.MONGODB_URI;
const dbName = process.env.MONGODB_DB || 'isru-metrics';

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { message } = req.body;
  if (!message || typeof message !== 'string') {
    return res.status(400).json({ error: 'Message required' });
  }

  let client;
  try {
    client = await MongoClient.connect(uri, { useNewUrlParser: true, useUnifiedTopology: true });
    const db = client.db(dbName);
    const collection = db.collection('feedback');
    await collection.insertOne({ message, createdAt: new Date() });
    res.status(200).json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Database error', details: err.message });
  } finally {
    if (client) await client.close();
  }
};
