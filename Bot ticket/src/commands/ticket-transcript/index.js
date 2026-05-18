const { SlashCommandBuilder, PermissionFlagsBits, AttachmentBuilder } = require('discord.js');
const path = require('path');
const fs = require('fs');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('ticket-transcript')
    .setDescription('Envia transcript do ticket atual (HTML/TXT)')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild),

  async execute(interaction) {
    const ticket = interaction.client.db.getTicketByChannel(interaction.channelId);
    if (!ticket) return interaction.reply({ content: '❌ Este canal não é um ticket.', ephemeral: true });

    // In DB we might have transcripts saved; we also store on disk in transcripts folder.
    const baseDir = path.join(__dirname, '..', '..', 'transcripts');

    const html = ticket.transcript_html;
    const txt = ticket.transcript_txt;

    // Prefer DB if present
    if (html) {
      const filePath = path.join(baseDir, `${interaction.channelId}.html`);
      try {
        fs.mkdirSync(baseDir, { recursive: true });
        fs.writeFileSync(filePath, html, 'utf8');
        const attachment = new AttachmentBuilder(filePath);
        return interaction.reply({ files: [attachment], ephemeral: true });
      } catch {
        // fallthrough
      }
    }

    if (txt) {
      const filePath = path.join(baseDir, `${interaction.channelId}.txt`);
      try {
        fs.mkdirSync(baseDir, { recursive: true });
        fs.writeFileSync(filePath, txt, 'utf8');
        const attachment = new AttachmentBuilder(filePath);
        return interaction.reply({ files: [attachment], ephemeral: true });
      } catch {
        // fallthrough
      }
    }

    return interaction.reply({ content: 'Transcript ainda não gerado/armazenado.', ephemeral: true });
  }
};

