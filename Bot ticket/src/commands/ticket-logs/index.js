const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('ticket-logs')
    .setDescription('Mostra logs do ticket atual')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild),

  async execute(interaction) {
    const ticket = interaction.client.db.getTicketByChannel(interaction.channelId);
    if (!ticket) return interaction.reply({ content: '❌ Este canal não é um ticket.', ephemeral: true });

    const rows = interaction.client.db.getTicketLogRows({ ticketId: ticket.id, limit: 50 });
    const text = rows.map(r => `${new Date(r.created_at).toLocaleString('pt-BR')} • ${r.event_type} • ${r.actor_username || '—'}: ${r.message_content || ''}`).join('\n');

    if (text.length === 0) return interaction.reply({ content: 'Sem logs.', ephemeral: true });
    if (text.length > 1900) {
      return interaction.reply({ content: 'Logs muito grandes para enviar direto. Use transcript.', ephemeral: true });
    }

    return interaction.reply({ content: `🧾 Logs do ticket (${rows.length})\n\n${text}`, ephemeral: true });
  }
};

