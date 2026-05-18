const path = require('path');
const Database = require('better-sqlite3');

let db;

function getDb() {
  if (db) return db;
  const dbPath = path.join(__dirname, '..', '..', 'database.sqlite');
  db = new Database(dbPath);
  db.pragma('journal_mode = WAL');
  return db;
}

async function initDb() {
  const d = getDb();

  d.exec(`
    CREATE TABLE IF NOT EXISTS tickets (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      guild_id TEXT NOT NULL,
      channel_id TEXT NOT NULL UNIQUE,
      user_id TEXT NOT NULL,
      username TEXT NOT NULL,
      staff_role_id TEXT,
      category_id TEXT NOT NULL,
      ticket_type TEXT NOT NULL,
      opened_at TEXT NOT NULL,
      closed_at TEXT,
      closed_by TEXT,
      total_seconds INTEGER,
      transcript_html TEXT,
      transcript_txt TEXT,
      attachments_json TEXT,
      status TEXT NOT NULL DEFAULT 'OPEN'
    );

    CREATE TABLE IF NOT EXISTS ticket_messages (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      ticket_channel_id TEXT NOT NULL,
      message_id TEXT NOT NULL,
      author_id TEXT NOT NULL,
      author_username TEXT NOT NULL,
      content TEXT,
      created_at TEXT NOT NULL,
      attachments_json TEXT,
      embeds_json TEXT
    );

    CREATE TABLE IF NOT EXISTS ticket_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      guild_id TEXT NOT NULL,
      ticket_channel_id TEXT,
      user_id TEXT,
      action TEXT NOT NULL,
      payload_json TEXT,
      created_at TEXT NOT NULL
    );
  `);
}

module.exports = { initDb, getDb };

