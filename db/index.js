const { createClient } = require('@libsql/client');
const path = require('path');
const fs = require('fs');
const bcrypt = require('bcryptjs');

let dbUrl = process.env.TURSO_DATABASE_URL;
let authToken = process.env.TURSO_AUTH_TOKEN;

if (!dbUrl) {
  const localDbDir = path.join(__dirname);
  if (!fs.existsSync(localDbDir)) {
    fs.mkdirSync(localDbDir, { recursive: true });
  }
  const localDbPath = path.join(localDbDir, 'data.sqlite');
  dbUrl = `file:${localDbPath}`;
}

const client = createClient({
  url: dbUrl,
  authToken: authToken || undefined,
});

const db = {
  client,

  // Run a query returning a single row as a plain object, or undefined
  async get(sql, params = []) {
    const args = Array.isArray(params) ? params : [params];
    const res = await client.execute({ sql, args });
    if (!res.rows || res.rows.length === 0) return undefined;
    return { ...res.rows[0] };
  },

  // Run a query returning all rows as an array of plain objects
  async all(sql, params = []) {
    const args = Array.isArray(params) ? params : [params];
    const res = await client.execute({ sql, args });
    return (res.rows || []).map((r) => ({ ...r }));
  },

  // Run an INSERT, UPDATE, or DELETE query
  async run(sql, params = []) {
    const args = Array.isArray(params) ? params : [params];
    const res = await client.execute({ sql, args });
    return {
      lastInsertRowid: res.lastInsertRowid !== undefined ? Number(res.lastInsertRowid) : undefined,
      changes: res.rowsAffected || 0,
    };
  },

  // Execute multiple SQL statements (for schema setup)
  async exec(sql) {
    return await client.executeMultiple(sql);
  },

  // Initialize schema and seed admin
  async init() {
    const isCloud = dbUrl.startsWith('libsql://') || dbUrl.startsWith('https://');
    console.log(`[db] Initializing database (${isCloud ? 'Turso Cloud SQLite' : 'Local SQLite file'})...`);

    // Create tables
    await db.exec(`
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        email TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        role TEXT NOT NULL DEFAULT 'user',
        currency TEXT DEFAULT 'INR',
        phone TEXT,
        monthly_income_target REAL DEFAULT 62000,
        monthly_savings_target REAL DEFAULT 20000,
        created_at TEXT NOT NULL DEFAULT (datetime('now'))
      );

      CREATE TABLE IF NOT EXISTS income (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        source TEXT NOT NULL,
        amount REAL NOT NULL,
        date TEXT NOT NULL,
        note TEXT,
        created_at TEXT NOT NULL DEFAULT (datetime('now')),
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      );

      CREATE TABLE IF NOT EXISTS expenses (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        category TEXT NOT NULL,
        amount REAL NOT NULL,
        date TEXT NOT NULL,
        note TEXT,
        created_at TEXT NOT NULL DEFAULT (datetime('now')),
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      );

      CREATE TABLE IF NOT EXISTS habits (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        name TEXT NOT NULL,
        frequency TEXT NOT NULL,
        target_amount REAL DEFAULT 0,
        created_at TEXT NOT NULL DEFAULT (datetime('now')),
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      );

      CREATE TABLE IF NOT EXISTS habit_logs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        habit_id INTEGER NOT NULL,
        user_id INTEGER NOT NULL,
        completed_on TEXT NOT NULL,
        FOREIGN KEY (habit_id) REFERENCES habits(id) ON DELETE CASCADE,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        UNIQUE (habit_id, completed_on)
      );

      CREATE TABLE IF NOT EXISTS goals (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        title TEXT NOT NULL,
        target_amount REAL NOT NULL,
        saved_amount REAL NOT NULL DEFAULT 0,
        deadline TEXT,
        created_at TEXT NOT NULL DEFAULT (datetime('now')),
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      );

      CREATE TABLE IF NOT EXISTS investments (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        asset_name TEXT NOT NULL,
        asset_type TEXT NOT NULL,
        amount_invested REAL NOT NULL,
        current_value REAL NOT NULL,
        date TEXT NOT NULL,
        created_at TEXT NOT NULL DEFAULT (datetime('now')),
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      );

      CREATE TABLE IF NOT EXISTS feedback (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER,
        message TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'open',
        created_at TEXT NOT NULL DEFAULT (datetime('now')),
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
      );
    `);

    // Ensure columns exist on existing users table
    try { await db.run('ALTER TABLE users ADD COLUMN phone TEXT'); } catch (_) {}
    try { await db.run('ALTER TABLE users ADD COLUMN monthly_income_target REAL DEFAULT 62000'); } catch (_) {}
    try { await db.run('ALTER TABLE users ADD COLUMN monthly_savings_target REAL DEFAULT 20000'); } catch (_) {}

    // Seed default admin
    try {
      const email = process.env.ADMIN_EMAIL || 'admin@financetrack.com';
      const password = process.env.ADMIN_PASSWORD || 'Admin@12345';
      const existing = await db.get('SELECT id FROM users WHERE email = ?', [email]);
      if (!existing) {
        const hash = bcrypt.hashSync(password, 10);
        await db.run(
          'INSERT INTO users (name, email, password_hash, role) VALUES (?, ?, ?, ?)',
          ['Admin', email, hash, 'admin']
        );
        console.log(`[seed] Admin user seeded successfully -> ${email}`);
      }
    } catch (err) {
      console.error('[seed] Admin check/seed error:', err);
    }
  },
};

module.exports = db;
