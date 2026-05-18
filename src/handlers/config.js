const config = require('../../config/config.json');

function envOrFallback(envKey, fallback) {
  return process.env[envKey] ?? fallback;
}

module.exports = {
  // Prefer env vars (Render) over config/config.json placeholders
  token: envOrFallback('BOT_TOKEN', envOrFallback('TOKEN', config.token)),
  clientId: envOrFallback('CLIENT_ID', config.clientId),

  staffRoleId: config.staffRoleId,
  ticketCategoryId: config.ticketCategoryId,
  logsChannelId: config.logsChannelId,
  transcriptsChannelId: config.transcriptsChannelId,
  panel: config.panel,
  messages: config.messages,
  cooldowns: config.cooldowns
};


