const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const config = require('../../config/loadConfig');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('ticket-delete')
    .setDescription('Deleta o canal do ticket (após fechamento)')
    .setDMPermission(false),

  async execute(interaction) {
    if (!interaction.memberPermissions?.has(PermissionFlagsBits.ManageChannels)) {
      return interaction.reply({ content: '❌ Sem permissão (Manage Channels).', ephemeral: true });
    }

    const ticket = interaction.client.db.getTicketByChannel(interaction.channelId);
    if (!ticket) return interaction.reply({ content: '❌ Este canal não é um ticket.', ephemeral: true });

    await interaction.reply({ content: '🗑️ Deletando ticket em instantes...', ephemeral: true });

    try {
      await interaction.channel.delete('Ticket deletado via comando');
    } catch (e) {
      await interaction.followUp({ content: '❌ Falha ao deletar o canal.', ephemeral: true });
    }
  }
};

