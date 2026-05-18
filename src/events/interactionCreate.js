const { PermissionsBitField, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, ModalBuilder, TextInputBuilder, TextInputStyle, ChannelType } = require('discord.js');
const config = require('../handlers/config');
const ticketManager = require('../handlers/ticketManager');
const { getDb } = require('../database/init');

module.exports = {
  name: 'interactionCreate',
  async execute(interaction, client) {
    if (interaction.isChatInputCommand()) {
      const cmd = client.commands.get(interaction.commandName);
      if (!cmd) return;
      try {
        await cmd.execute(interaction, client);
      } catch (e) {
        console.error(e);
        if (interaction.deferred || interaction.replied) {
          await interaction.followUp({ content: '❌ Ocorreu um erro ao executar este comando.', ephemeral: true });
        } else {
          await interaction.reply({ content: '❌ Ocorreu um erro ao executar este comando.', ephemeral: true });
        }
      }
      return;
    }

    // Select menu
    if (interaction.isStringSelectMenu()) {
      if (interaction.customId !== 'ticket_category_select') return;
      const typeId = interaction.values[0];

      // Cooldown anti-spam
      const key = `openTicket:${interaction.user.id}`;
      const now = Date.now();
      const cd = client.cooldowns.get(key);
      if (cd && now < cd) {
        const sec = Math.ceil((cd - now) / 1000);
        return interaction.reply({ content: `${config.messages.antiSpam} (${sec}s)`, ephemeral: true });
      }
      client.cooldowns.set(key, now + config.cooldowns.openTicketSeconds * 1000);

      const res = await ticketManager.openTicket({ interaction, typeId });
      return;
    }

    // Buttons
    if (interaction.isButton()) {
      if (interaction.customId === 'ticket_close') {
        return ticketManager.closeTicket({ interaction });
      }
    }
  }
};

