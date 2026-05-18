const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('ticket-remove')
    .setDescription('Remove um membro do ticket')
    .addUserOption(o => o.setName('user').setDescription('Usuário para remover').setRequired(true)),

  async execute(interaction) {
    if (!interaction.memberPermissions?.has(PermissionFlagsBits.ManageChannels)) {
      return interaction.reply({ content: '❌ Sem permissão (Manage Channels).', ephemeral: true });
    }

    const ticket = interaction.client.db.getTicketByChannel(interaction.channelId);
    if (!ticket) return interaction.reply({ content: '❌ Este canal não é um ticket.', ephemeral: true });

    const user = interaction.options.getUser('user', true);

    try {
      await interaction.channel.permissionOverwrites.edit(user.id, { ViewChannel: false });
      return interaction.reply({ content: `✅ ${user.tag} foi removido do ticket.`, ephemeral: true });
    } catch {
      return interaction.reply({ content: '❌ Não foi possível remover o usuário.', ephemeral: true });
    }
  }
};

