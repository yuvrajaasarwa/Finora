const path = require('path');
const fs = require('fs');
const Database = require('better-sqlite3');

const dbPath = path.join(__dirname, 'data.sqlite');
let db = null;

function getDb() {
  if (!db) {
    db = new Database(dbPath);
    db.pragma('journal_mode = WAL');
    db.pragma('foreign_keys = ON');
  }
  return db;
}

async function init() {
  const database = getDb();

  database.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      currency TEXT DEFAULT 'USD',
      role TEXT DEFAULT 'user',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS income (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      source TEXT NOT NULL,
      amount REAL NOT NULL,
      frequency TEXT DEFAULT 'monthly',
      date TEXT NOT NULL,
      category TEXT DEFAULT 'General',
      notes TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS expenses (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      title TEXT NOT NULL,
      amount REAL NOT NULL,
      category TEXT DEFAULT 'Other',
      date TEXT NOT NULL,
      notes TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS habits (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      title TEXT NOT NULL,
      frequency TEXT DEFAULT 'daily',
      target_days INTEGER DEFAULT 30,
      completed_days INTEGER DEFAULT 0,
      streak INTEGER DEFAULT 0,
      last_completed TEXT,
      category TEXT DEFAULT 'Financial',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS goals (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      title TEXT NOT NULL,
      target_amount REAL NOT NULL,
      current_amount REAL DEFAULT 0,
      target_date TEXT,
      category TEXT DEFAULT 'Savings',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS investments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      name TEXT NOT NULL,
      type TEXT NOT NULL,
      amount REAL NOT NULL,
      returns REAL DEFAULT 0,
      date TEXT,
      notes TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS feedback (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER,
      user_name TEXT,
      user_email TEXT,
      rating INTEGER DEFAULT 5,
      message TEXT NOT NULL,
      status TEXT DEFAULT 'pending',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  runMigrations(database);

  console.log('[DB] SQLite database initialized successfully');
  return database;
}

function runMigrations(database) {
  const getCols = (tableName) => {
    try {
      return database.pragma(`table_info(${tableName})`).map(c => c.name);
    } catch (e) {
      return [];
    }
  };

  // users
  let cols = getCols('users');
  if (cols.includes('password_hash') && !cols.includes('password')) {
    database.exec('ALTER TABLE users RENAME COLUMN password_hash TO password');
  }
  cols = getCols('users');
  if (cols.length > 0 && !cols.includes('password')) {
    database.exec("ALTER TABLE users ADD COLUMN password TEXT NOT NULL DEFAULT ''");
  }
  if (cols.length > 0 && !cols.includes('currency')) {
    database.exec("ALTER TABLE users ADD COLUMN currency TEXT DEFAULT 'USD'");
  }
  if (cols.length > 0 && !cols.includes('role')) {
    database.exec("ALTER TABLE users ADD COLUMN role TEXT DEFAULT 'user'");
  }

  // income
  cols = getCols('income');
  if (cols.includes('note') && !cols.includes('notes')) {
    database.exec('ALTER TABLE income RENAME COLUMN note TO notes');
  }
  cols = getCols('income');
  if (cols.length > 0 && !cols.includes('frequency')) {
    database.exec("ALTER TABLE income ADD COLUMN frequency TEXT DEFAULT 'monthly'");
  }
  if (cols.length > 0 && !cols.includes('category')) {
    database.exec("ALTER TABLE income ADD COLUMN category TEXT DEFAULT 'General'");
  }
  if (cols.length > 0 && !cols.includes('notes')) {
    database.exec('ALTER TABLE income ADD COLUMN notes TEXT');
  }

  // expenses
  cols = getCols('expenses');
  if (cols.includes('note') && !cols.includes('notes')) {
    database.exec('ALTER TABLE expenses RENAME COLUMN note TO notes');
  }
  cols = getCols('expenses');
  if (cols.length > 0 && !cols.includes('title')) {
    database.exec("ALTER TABLE expenses ADD COLUMN title TEXT DEFAULT 'Expense'");
  }
  if (cols.length > 0 && !cols.includes('notes')) {
    database.exec('ALTER TABLE expenses ADD COLUMN notes TEXT');
  }

  // habits
  cols = getCols('habits');
  if (cols.includes('name') && !cols.includes('title')) {
    database.exec('ALTER TABLE habits RENAME COLUMN name TO title');
  }
  if (cols.includes('target_amount') && !cols.includes('target_days')) {
    database.exec('ALTER TABLE habits RENAME COLUMN target_amount TO target_days');
  }
  cols = getCols('habits');
  if (cols.length > 0 && !cols.includes('title')) {
    database.exec("ALTER TABLE habits ADD COLUMN title TEXT DEFAULT 'Habit'");
  }
  if (cols.length > 0 && !cols.includes('frequency')) {
    database.exec("ALTER TABLE habits ADD COLUMN frequency TEXT DEFAULT 'daily'");
  }
  if (cols.length > 0 && !cols.includes('target_days')) {
    database.exec('ALTER TABLE habits ADD COLUMN target_days INTEGER DEFAULT 30');
  }
  if (cols.length > 0 && !cols.includes('completed_days')) {
    database.exec('ALTER TABLE habits ADD COLUMN completed_days INTEGER DEFAULT 0');
  }
  if (cols.length > 0 && !cols.includes('streak')) {
    database.exec('ALTER TABLE habits ADD COLUMN streak INTEGER DEFAULT 0');
  }
  if (cols.length > 0 && !cols.includes('last_completed')) {
    database.exec('ALTER TABLE habits ADD COLUMN last_completed TEXT');
  }
  if (cols.length > 0 && !cols.includes('category')) {
    database.exec("ALTER TABLE habits ADD COLUMN category TEXT DEFAULT 'Financial'");
  }

  // goals
  cols = getCols('goals');
  if (cols.includes('saved_amount') && !cols.includes('current_amount')) {
    database.exec('ALTER TABLE goals RENAME COLUMN saved_amount TO current_amount');
  }
  if (cols.includes('deadline') && !cols.includes('target_date')) {
    database.exec('ALTER TABLE goals RENAME COLUMN deadline TO target_date');
  }
  cols = getCols('goals');
  if (cols.length > 0 && !cols.includes('current_amount')) {
    database.exec('ALTER TABLE goals ADD COLUMN current_amount REAL DEFAULT 0');
  }
  if (cols.length > 0 && !cols.includes('target_date')) {
    database.exec('ALTER TABLE goals ADD COLUMN target_date TEXT');
  }
  if (cols.length > 0 && !cols.includes('category')) {
    database.exec("ALTER TABLE goals ADD COLUMN category TEXT DEFAULT 'Savings'");
  }

  // investments
  cols = getCols('investments');
  if (cols.includes('asset_name') && !cols.includes('name')) {
    database.exec('ALTER TABLE investments RENAME COLUMN asset_name TO name');
  }
  if (cols.includes('asset_type') && !cols.includes('type')) {
    database.exec('ALTER TABLE investments RENAME COLUMN asset_type TO type');
  }
  if (cols.includes('amount_invested') && !cols.includes('amount')) {
    database.exec('ALTER TABLE investments RENAME COLUMN amount_invested TO amount');
  }
  if (cols.includes('current_value') && !cols.includes('returns')) {
    database.exec('ALTER TABLE investments RENAME COLUMN current_value TO returns');
  }
  cols = getCols('investments');
  if (cols.length > 0 && !cols.includes('name')) {
    database.exec("ALTER TABLE investments ADD COLUMN name TEXT DEFAULT 'Investment'");
  }
  if (cols.length > 0 && !cols.includes('type')) {
    database.exec("ALTER TABLE investments ADD COLUMN type TEXT DEFAULT 'Stocks'");
  }
  if (cols.length > 0 && !cols.includes('amount')) {
    database.exec('ALTER TABLE investments ADD COLUMN amount REAL DEFAULT 0');
  }
  if (cols.length > 0 && !cols.includes('returns')) {
    database.exec('ALTER TABLE investments ADD COLUMN returns REAL DEFAULT 0');
  }
  if (cols.length > 0 && !cols.includes('notes')) {
    database.exec('ALTER TABLE investments ADD COLUMN notes TEXT');
  }

  // feedback
  cols = getCols('feedback');
  if (cols.length > 0 && !cols.includes('user_name')) {
    database.exec('ALTER TABLE feedback ADD COLUMN user_name TEXT');
  }
  if (cols.length > 0 && !cols.includes('user_email')) {
    database.exec('ALTER TABLE feedback ADD COLUMN user_email TEXT');
  }
  if (cols.length > 0 && !cols.includes('rating')) {
    database.exec('ALTER TABLE feedback ADD COLUMN rating INTEGER DEFAULT 5');
  }
}

function query(sql, params = []) {
  return getDb().prepare(sql).all(...(Array.isArray(params) ? params : [params]));
}

function get(sql, params = []) {
  return getDb().prepare(sql).get(...(Array.isArray(params) ? params : [params]));
}

function run(sql, params = []) {
  return getDb().prepare(sql).run(...(Array.isArray(params) ? params : [params]));
}

module.exports = {
  init,
  getDb,
  query,
  get,
  run
};
