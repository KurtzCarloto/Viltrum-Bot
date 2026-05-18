const { EmbedBuilder, ActionRowBuilder, StringSelectMenuBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const config = require('../../config/loadConfig');

const categoryButtons = [
  { key: 'suporte', emoji: '🛠️', label: 'Suporte', style: ButtonStyle.Primary },
  { key: 'denuncia', emoji: '🛡️', label: 'Denúncia', style: ButtonStyle.Danger },
  { key: 'compra', emoji: '🛒', label: 'Compra', style: ButtonStyle.Success },
  { key: 'parceria', emoji: '🤝', label: 'Parceria', style: ButtonStyle.Secondary }
];

function parseColor(input) {
  // Accept number (0x...), or string like "0x5865f2"
  if (typeof input === 'number') return input;
  if (typeof input === 'string') {
    const s = input.trim().toLowerCase();
    const n = Number(s.startsWith('0x') ? s : `0x${s}`);
    if (!Number.isNaN(n)) return n;
  }
  return null;
}

function getPanelEmbed() {
  return new EmbedBuilder()
    .setColor(parseColor(config.panel?.color) ?? 0x5865F2)
    .setTitle(config.panel?.title ?? '🎫 Tickets')
    .setDescription(config.panel?.description ?? 'Abra um ticket para falar com a staff.')
    .setFooter({ text: config.panel?.footer ?? 'Ticket Bot Premium' })
    .setTimestamp();
}


function getTicketPanelComponents() {
  const buttonRow = new ActionRowBuilder().addComponents(
    ...categoryButtons.map(b => new ButtonBuilder().setCustomId(`ticket_cat:${b.key}`).setLabel(`${b.emoji} ${b.label}`).setStyle(b.style))
  );

  const selectRow = new ActionRowBuilder().addComponents(
    new StringSelectMenuBuilder()
      .setCustomId('ticket_select')
      .setPlaceholder('Selecionar categoria do ticket...')
      .addOptions(
        categoryButtons.map(b => ({
          label: b.label,
          value: b.key,
          description: `Abrir ticket para ${b.label}`,
          emoji: b.emoji.replace(':', '')
        }))
      )
  );

  return [buttonRow, selectRow];
}

module.exports = { getPanelEmbed, getTicketPanelComponents };

