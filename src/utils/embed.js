const { EmbedBuilder } = require('discord.js');

module.exports = {
  makePanelEmbed({ title, description, bannerUrl, footer }) {
    const e = new EmbedBuilder()
      .setTitle(title)
      .setDescription(description)
      .setColor(0x5865F2)
      .setFooter({ text: footer || 'Ticket Bot' });

    if (bannerUrl) e.setImage(bannerUrl);
    return e;
  },

  makeTicketEmbed({ typeLabel, username, openAt }) {
    return new EmbedBuilder()
      .setColor(0x00b0f4)
      .setTitle(`🎫 Ticket • ${typeLabel}`)
      .setDescription(`Abrido por: **${username}**\nHorário de abertura: **${openAt}**`)
      .setTimestamp(new Date(openAt));
  }
};

