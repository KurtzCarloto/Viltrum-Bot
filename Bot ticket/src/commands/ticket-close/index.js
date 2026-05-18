const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const config = require('../../config/loadConfig');


module.exports = {
  data: new SlashCommandBuilder()
    .setName('ticket-close')
    .setDescription('Fecha o ticket atual')
    .setDMPermission(false),

  async execute(interaction) {
    // Only staff or ticket owner
    const ticket = interaction.client.db.getTicketByChannel(interaction.channelId);
    if (!ticket) return interaction.reply({ content: '❌ Este canal não é um ticket.', ephemeral: true });

    const isStaff = interaction.member.roles?.cache?.has(config.staffRoleId);
    const isOwner = ticket.user_id === interaction.user.id;

    if (!isStaff && !isOwner && !interaction.memberPermissions?.has(PermissionFlagsBits.ManageChannels)) {
      return interaction.reply({ content: '❌ Sem permissão para fechar este ticket.', ephemeral: true });
    }

    const closedBy = interaction.user.id;

    // Defer
    await interaction.reply({ content: config.messages?.closeTicketTitle ?? 'Fechando...', ephemeral: true });

    // Transcript placeholder (full generation implemented in tickets handler/event)
    // Close in DB
    const updated = interaction.client.db.closeTicket({ channelId: interaction.channelId, closedBy });
    const closedAt = updated?.closed_at;

    // Move channel name
    const ownerTag = ticket.username;

    // Soft close: restrict permissions
    const channel = interaction.channel;
    try {
      await channel.permissionOverwrites.edit(interaction.guild.roles.everyone, { ViewChannel: false });
    } catch {}

    // Log
    const logsCh = interaction.guild.channels.cache.get(config.logsChannelId);
    if (logsCh) {
      await logsCh.send(`🔒 Ticket fechado: **#${channel.name}** • ${ownerTag} • ${interaction.user.tag}`);
    }

    // Schedule delete after 5s? leave.
    setTimeout(() => {
      // keep channel
    }, 5000);
  }
};

