async function computeServerStats(client, config) {
  const guild = client.guilds.cache.get(config.guildId) || client.guilds.cache.first();
  if (!guild) {
    return {
      members: 0,
      online: 0,
      boosts: 0,
      tickets: 0,
      channels: 0,
      roles: 0,
      ping: client.ws?.ping ?? 0,
      botStatus: client.ws?.status === 0 ? 'offline' : 'online'
    };
  }

  const members = await guild.members.fetch().catch(() => null);
  const online = members ? members.filter(m => m.presence?.status && m.presence.status !== 'offline').size : 0;

  const boosts = guild.premiumSubscriptionCount ?? 0;
  const channels = guild.channels.cache.size;
  const roles = guild.roles.cache.size;

  let tickets = 0;
  try {
    const row = await client.db.db
      .prepare(`SELECT COUNT(*) as c FROM tickets WHERE status = 'OPEN'`)
      .get();
    tickets = row?.c ?? 0;
  } catch {
    tickets = 0;
  }

  return {
    members: members ? members.size : (guild.memberCount ?? 0),
    online,
    boosts,
    tickets,
    channels,
    roles,
    ping: client.ws?.ping ?? 0,
    botStatus: client.ws?.status === 0 ? 'offline' : 'online'
  };
}

module.exports = { computeServerStats };

