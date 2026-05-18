const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('ticket-rename')
    .setDescription('Renomeia o ticket')
    .addStringOption(o => o.setName('name').setDescription('Novo nome').setRequired(true,))
    .setDMPermission(false),

  async execute(interaction) {
    if (!interaction.memberPermissions?.has(PermissionFlagsBits.ManageChannels)) {
      return interaction.reply({ content: '❌ Sem permissão (Manage Channels).', ephemeral: true });
    }

    const ticket = interaction.client.db.getTicketByChannel(interaction.channelId);
    if (!ticket) return interaction.reply({ content: '❌ Este canal não é um ticket.', ephemeral: true });

    const name = interaction.options.getString('name', true);
    try {
      await interaction.channel.setName(name.slice(0, 90));
      return interaction.reply({ content: '✅ Ticket renomeado.', ephemeral: true });
    } catch {
      return interaction.reply({ content: '❌ Não foi possível renomear.', ephemeral: true });
    }
  }
};

