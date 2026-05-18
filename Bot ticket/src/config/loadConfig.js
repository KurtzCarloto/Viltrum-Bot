const fs = require('fs');
const path = require('path');

const configPath = path.join(__dirname, '..', '..', 'config', 'config.json');
let raw = {};
try {
  raw = JSON.parse(fs.readFileSync(configPath, 'utf8'));
} catch {
  raw = {};
}

module.exports = {
  token: process.env.BOT_TOKEN || raw.token,
  guildId: raw.guildId,

  staffRoleId: raw.staffRoleId,
  ticketCategoryId: raw.ticketCategoryId,
  logsChannelId: raw.logsChannelId,

  panel: raw.panel,
  messages: raw.messages,
  antiSpam: raw.antiSpam
};

