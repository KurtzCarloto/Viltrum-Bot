const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const { getDb } = require('../database/init');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('ticket-delete')
    .setDescription('Deleta o ticket (canal) e remove registros')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels),

  async execute(interaction) {
    const db = getDb();
    const channelId = interaction.channel.id;
    const ticket = db.prepare('SELECT * FROM tickets WHERE channel_id = ? LIMIT 1').get(channelId);
    if (!ticket) return interaction.reply({ content: '❌ Este canal não é um ticket.', ephemeral: true });

    db.prepare('DELETE FROM ticket_messages WHERE ticket_channel_id = ?').run(channelId);
    db.prepare('DELETE FROM ticket_logs WHERE ticket_channel_id = ?').run(channelId);
    db.prepare('DELETE FROM tickets WHERE channel_id = ?').run(channelId);

    await interaction.reply({ content: '🗑️ Deletando ticket...', ephemeral: true });
    await interaction.channel.delete('Ticket deletado via comando');
  }
};

