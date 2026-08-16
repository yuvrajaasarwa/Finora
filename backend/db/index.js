const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const User = require('../models/user');
const Income = require('../models/income');
const Expense = require('../models/expense');
const { Habit, HabitLog } = require('../models/habit');
const Goal = require('../models/goal');
const Investment = require('../models/investment');
const Feedback = require('../models/feedback');

let mongoServer = null;

async function connectDB() {
  const uri = process.env.MONGODB_URI;

  if (uri) {
    try {
      console.log(`[db] Connecting to MongoDB at ${uri.replace(/\/\/.*@/, '//***@')}...`);
      await mongoose.connect(uri, { serverSelectionTimeoutMS: 5000 });
      console.log('[db] Connected to MongoDB successfully.');
      return;
    } catch (err) {
      console.warn('[db] Failed to connect to primary MONGODB_URI, falling back to memory server:', err.message);
    }
  }

  // Attempt local connection first before starting MongoMemoryServer
  const localUri = 'mongodb://127.0.0.1:27017/wealthpulse';
  try {
    console.log('[db] Attempting local MongoDB connection...');
    await mongoose.connect(localUri, { serverSelectionTimeoutMS: 3000 });
    console.log('[db] Connected to local MongoDB successfully.');
    return;
  } catch (err) {
    console.warn('[db] Local MongoDB daemon not reachable. Launching in-memory Mongo database...');
  }

  // In-Memory MongoDB Fallback (for zero-setup dev & automated testing)
  try {
    const { MongoMemoryServer } = require('mongodb-memory-server');
    mongoServer = await MongoMemoryServer.create();
    const mongoUri = mongoServer.getUri();
    await mongoose.connect(mongoUri);
    console.log('[db] Connected to In-Memory MongoDB server successfully.');
  } catch (memErr) {
    console.error('[db] Fatal error: Could not initialize In-Memory MongoDB server:', memErr);
    throw memErr;
  }
}

async function seedAdmin() {
  try {
    const email = (process.env.ADMIN_EMAIL || 'admin@financetrack.com').trim().toLowerCase();
    const password = process.env.ADMIN_PASSWORD || 'Admin@12345';
    const existing = await User.findOne({ email });
    if (!existing) {
      const hash = bcrypt.hashSync(password, 10);
      await User.create({
        name: 'Admin',
        email,
        password_hash: hash,
        role: 'admin',
        currency: 'INR',
      });
      console.log(`[seed] Admin user seeded successfully -> ${email}`);
    }
  } catch (err) {
    console.error('[seed] Admin seeding error:', err);
  }
}

const db = {
  mongoose,
  User,
  Income,
  Expense,
  Habit,
  HabitLog,
  Goal,
  Investment,
  Feedback,

  async init() {
    if (mongoose.connection.readyState === 1) return;
    await connectDB();
    await seedAdmin();
  },

  async close() {
    if (mongoose.connection.readyState !== 0) {
      await mongoose.disconnect();
    }
    if (mongoServer) {
      await mongoServer.stop();
    }
  },
};

module.exports = db;
