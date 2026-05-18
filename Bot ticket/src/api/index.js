const express = require('express');
const cors = require('cors');

function createApiServer({ port, socket, client }) {
  const app = express();

  app.use(cors());
  app.use(express.json());

  // Health
  app.get('/api/bot-status', (req, res) => {
    // discord.js v14: ws status 0=Disconnected, 1=Connecting, 2=WebSocketConnecting, 3=Ready
    const s = client?.ws?.status;
    const botStatus = s === 0 ? 'offline' : 'online';
    res.json({ botStatus });
  });


  app.get('/api/server-stats', async (req, res) => {
    try {
      if (!client) return res.status(500).json({ error: 'Bot not ready' });

      const guildId = client.guilds.cache.first()?.id || undefined;
      // Prefer config guild later; this is best-effort for now.

      const guild = client.guilds.cache.get(guildId) || client.guilds.cache.first();
      if (!guild) return res.json({
        members: 0,
        online: 0,
        boosts: 0,
        tickets: 0,
        channels: 0,
        roles: 0,
        ping: client.ws?.ping ?? 0,
        botStatus: 'online'
      });

      const members = await guild.members.fetch().catch(() => null);
      const online = members ? members.filter(m => m.presence?.status !== 'offline').size : 0;
      const boosts = guild.premiumSubscriptionCount ?? 0;

      const channels = guild.channels.cache.size;
      const roles = guild.roles.cache.size;

      // Tickets abertos via DB
      let tickets = 0;
      try {
        const row = client.db.db
          .prepare(`SELECT COUNT(*) as c FROM tickets WHERE status = 'OPEN'`)
          .get();
        tickets = row?.c ?? 0;
      } catch {
        tickets = 0;
      }


      res.json({
        members: members ? members.size : guild.memberCount ?? 0,
        online,
        boosts,
        tickets,
        channels,
        roles,
        ping: client.ws?.ping ?? 0,
        botStatus: client?.ws?.status === 0 ? 'offline' : 'online'
      });
    } catch (e) {
      res.status(500).json({ error: 'Failed to compute stats' });
    }
  });

  app.get('/api/tickets', async (req, res) => {
    try {
      if (!client?.db) return res.status(500).json({ error: 'DB not ready' });
      const rows = await client.db.db
        .prepare(
          `SELECT id, channel_id, user_id, username, category, created_at, status FROM tickets ORDER BY created_at DESC LIMIT 100`
        )
        .all();
      res.json({ tickets: rows });
    } catch (e) {
      res.status(500).json({ error: 'Failed to fetch tickets' });
    }
  });

  app.listen(port, () => {
    console.log(`[API] listening on http://localhost:${port}`);
  });
}

module.exports = { createApiServer };

