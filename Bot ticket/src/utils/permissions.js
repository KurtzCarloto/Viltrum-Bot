const { PermissionsBitField } = require('discord.js');
const config = require('../config/loadConfig');

function hasStaff(interaction) {
  const member = interaction.member;
  if (!member) return false;
  const roleId = config.staffRoleId;
  if (!roleId) return false;
  return member.roles?.cache?.has(roleId);
}

function requireStaff(interaction) {
  if (!hasStaff(interaction)) {
    const err = new Error('NO_STAFF');
    err.code = 'NO_STAFF';
    throw err;
  }
}

function canManageTicket(member) {
  return hasStaff({ member, reply: () => {} });
}

module.exports = { hasStaff, requireStaff };

