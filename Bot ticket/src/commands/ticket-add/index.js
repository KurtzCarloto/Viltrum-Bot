const { SlashCommandBuilder, PermissionFlagsBits, ChannelType } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('ticket-add')
    .setDescription('Adiciona um membro no ticket')
    .addUserOption(o => o.setName('user').setDescription('Usuário para adicionar').setRequired(true)),

  async execute(interaction) {
    if (!interaction.memberPermissions?.has(PermissionFlagsBits.ManageChannels)) {
      return interaction.reply({ content: '❌ Sem permissão (Manage Channels).', ephemeral: true });
    }

    const ticket = interaction.client.db.getTicketByChannel(interaction.channelId);
    if (!ticket) return interaction.reply({ content: '❌ Este canal não é um ticket.', ephemeral: true });

    const user = interaction.options.getUser('user', true);

    try {
      await interaction.channel.permissionOverwrites.edit(user.id, { ViewChannel: true, SendMessages: true, ReadMessageHistory: true });
      return interaction.reply({ content: `✅ ${user.tag} foi adicionado no ticket.`, ephemeral: true });
    } catch {
      return interaction.reply({ content: '❌ Não foi possível adicionar o usuário.', ephemeral: true });
    }
  }
};

