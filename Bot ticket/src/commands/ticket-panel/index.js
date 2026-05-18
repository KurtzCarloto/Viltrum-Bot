const { SlashCommandBuilder, PermissionFlagsBits, ActionRowBuilder, StringSelectMenuBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder, ChannelType } = require('discord.js');
const config = require('../../config/loadConfig');
const { getPanelEmbed, getTicketPanelComponents } = require('./panelView');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('ticket-panel')
    .setDescription('Envia o painel de tickets')
    .addChannelOption(opt => opt.setName('channel').setDescription('Canal para enviar o painel').setRequired(false).addChannelTypes(ChannelType.GuildText)),

  async execute(interaction) {
    // Permission: manage guild
    if (!interaction.memberPermissions?.has(PermissionFlagsBits.ManageGuild)) {
      return interaction.reply({ content: '❌ Sem permissão (Manage Server).', ephemeral: true });
    }

    const channel = interaction.options.getChannel('channel') || interaction.channel;

    const embed = getPanelEmbed();
    const components = getTicketPanelComponents();

    await interaction.reply({ content: '📨 Enviando painel...', ephemeral: true });
    await channel.send({ embeds: [embed], components });
  }
};

