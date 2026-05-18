const { SlashCommandBuilder, PermissionFlagsBits, ActionRowBuilder, StringSelectMenuBuilder, EmbedBuilder, ChannelType } = require('discord.js');
const config = require('../handlers/config');
const { makePanelEmbed } = require('../utils/embed');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('ticket-panel')
    .setDescription('Envia o painel de tickets')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .addChannelOption(opt => opt.setName('channel').setDescription('Canal para enviar o painel').setRequired(true))
    .addBooleanOption(opt => opt.setName('private').setDescription('Se verdadeiro, envia mensagens privadas').setRequired(false)),

  async execute(interaction) {
    const channel = interaction.options.getChannel('channel');
    const embed = makePanelEmbed({
      title: config.panel.title,
      description: config.panel.description,
      bannerUrl: config.panel.bannerUrl,
      footer: config.panel.footer
    });

    const select = new StringSelectMenuBuilder()
      .setCustomId('ticket_category_select')
      .setPlaceholder('Escolha a categoria do ticket')
      .setMinValues(1)
      .setMaxValues(1)

    for (const c of config.panel.categories) {
      select.addOptions({
        label: c.label,
        description: c.description,
        value: c.id,
        emoji: c.emoji
      });
    }

    const row = new ActionRowBuilder().addComponents(select);

    // Additional buttons (visual)
    // They route to select via info messages; real creation happens on select
    await channel.send({ embeds: [embed], components: [row] });

    await interaction.reply({ content: '✅ Painel enviado com sucesso!', ephemeral: true });
  }
};

