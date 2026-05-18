const config = require('../../config/config.json');

module.exports = {
  token: config.token,
  clientId: config.clientId,
  staffRoleId: config.staffRoleId,
  ticketCategoryId: config.ticketCategoryId,
  logsChannelId: config.logsChannelId,
  transcriptsChannelId: config.transcriptsChannelId,
  panel: config.panel,
  messages: config.messages,
  cooldowns: config.cooldowns
};

