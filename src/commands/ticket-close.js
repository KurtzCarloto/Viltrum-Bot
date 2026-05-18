const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const ticketManager = require('../handlers/ticketManager');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('ticket-close')
    .setDescription('Fecha o ticket atual')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels),

  async execute(interaction) {
    await ticketManager.closeTicket({ interaction });
  }
};

