const sqlite3 = require('sqlite3');

class SQLiteDB {
  constructor({ filename }) {
    this.filename = filename;
    this.db = new sqlite3.Database(filename);
  }

  run(sql, params = []) {
    return new Promise((resolve, reject) => {
      this.db.run(sql, params, function (err) {
        if (err) return reject(err);
        resolve({ lastID: this.lastID, changes: this.changes });
      });
    });
  }

  get(sql, params = []) {
    return new Promise((resolve, reject) => {
      this.db.get(sql, params, (err, row) => {
        if (err) return reject(err);
        resolve(row);
      });
    });
  }

  all(sql, params = []) {
    return new Promise((resolve, reject) => {
      this.db.all(sql, params, (err, rows) => {
        if (err) return reject(err);
        resolve(rows);
      });
    });
  }

  async init() {
    // WAL
    await this.run('PRAGMA journal_mode = WAL');

    await this.run(`
      CREATE TABLE IF NOT EXISTS tickets (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        guild_id TEXT NOT NULL,
        channel_id TEXT NOT NULL UNIQUE,
        user_id TEXT NOT NULL,
        username TEXT NOT NULL,
        staff_role_id TEXT,
        category TEXT NOT NULL,
        created_at INTEGER NOT NULL,
        closed_at INTEGER,
        closed_by TEXT,
        total_ms INTEGER,
        transcript_html TEXT,
        transcript_txt TEXT,
        attachments_json TEXT,
        status TEXT NOT NULL DEFAULT 'OPEN'
      );
    `);

    await this.run(`
      CREATE TABLE IF NOT EXISTS ticket_logs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        guild_id TEXT NOT NULL,
        ticket_id INTEGER NOT NULL,
        channel_id TEXT NOT NULL,
        event_type TEXT NOT NULL,
        actor_id TEXT,
        actor_username TEXT,
        message_content TEXT,
        created_at INTEGER NOT NULL,
        raw_json TEXT,
        FOREIGN KEY (ticket_id) REFERENCES tickets(id)
      );
    `);

    await this.run(`
      CREATE TABLE IF NOT EXISTS ticket_messages (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        guild_id TEXT NOT NULL,
        ticket_id INTEGER NOT NULL,
        message_id TEXT NOT NULL,
        author_id TEXT NOT NULL,
        author_username TEXT NOT NULL,
        content TEXT,
        created_at INTEGER NOT NULL,
        attachments_json TEXT,
        FOREIGN KEY (ticket_id) REFERENCES tickets(id),
        UNIQUE(message_id, ticket_id)
      );
    `);
  }

  // Ticket queries
  getTicketByChannel(channelId) {
    return this.get('SELECT * FROM tickets WHERE channel_id = ?', [channelId]);
  }

  async createTicket({ guildId, channelId, userId, username, category, staffRoleId }) {
    const res = await this.run(
      `INSERT INTO tickets (guild_id, channel_id, user_id, username, staff_role_id, category, created_at, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, 'OPEN')`,
      [guildId, channelId, userId, username, staffRoleId, category, Date.now()]
    );
    return res.lastID;
  }

  logEvent({ guildId, ticketId, channelId, eventType, actorId, actorUsername, messageContent, rawJson }) {
    return this.run(
      `INSERT INTO ticket_logs (guild_id, ticket_id, channel_id, event_type, actor_id, actor_username, message_content, created_at, raw_json)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        guildId,
        ticketId,
        channelId,
        eventType,
        actorId || null,
        actorUsername || null,
        messageContent || null,
        Date.now(),
        rawJson ? JSON.stringify(rawJson) : null
      ]
    );
  }

  addMessage({ guildId, ticketId, messageId, authorId, authorUsername, content, attachments }) {
    return this.run(
      `INSERT OR IGNORE INTO ticket_messages (guild_id, ticket_id, message_id, author_id, author_username, content, created_at, attachments_json)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        guildId,
        ticketId,
        messageId,
        authorId,
        authorUsername,
        content || null,
        Date.now(),
        attachments ? JSON.stringify(attachments) : null
      ]
    );
  }

  async closeTicket({ channelId, closedBy }) {
    const t = await this.getTicketByChannel(channelId);
    if (!t) return null;

    const createdAt = t.created_at;
    const closedAt = Date.now();
    const totalMs = closedAt - createdAt;

    await this.run(
      `UPDATE tickets
       SET closed_at = ?, closed_by = ?, total_ms = ?, status = 'CLOSED'
       WHERE channel_id = ?`,
      [closedAt, closedBy, totalMs, channelId]
    );

    return this.getTicketByChannel(channelId);
  }

  setTranscripts({ channelId, html, txt }) {
    return this.run(
      `UPDATE tickets
       SET transcript_html = ?, transcript_txt = ?
       WHERE channel_id = ?`,
      [html || null, txt || null, channelId]
    );
  }

  setAttachments({ channelId, attachments }) {
    return this.run(
      `UPDATE tickets
       SET attachments_json = ?
       WHERE channel_id = ?`,
      [attachments ? JSON.stringify(attachments) : null, channelId]
    );
  }

  getTicketLogRows({ ticketId, limit = 100 }) {
    return this.all(
      `SELECT * FROM ticket_logs WHERE ticket_id = ? ORDER BY created_at DESC LIMIT ?`,
      [ticketId, limit]
    );
  }

  getTicketMessages({ ticketId }) {
    return this.all(
      `SELECT * FROM ticket_messages WHERE ticket_id = ? ORDER BY created_at ASC`,
      [ticketId]
    );
  }

  getTicketsByUser({ guildId, userId }) {
    return this.all(
      `SELECT * FROM tickets WHERE guild_id = ? AND user_id = ? ORDER BY created_at DESC`,
      [guildId, userId]
    );
  }
}

module.exports = { Database: SQLiteDB };


