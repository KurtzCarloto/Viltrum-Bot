const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('ticket-config')
    .setDescription('Comando auxiliar de configuração (stub)')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild),

  async execute(interaction) {
    return interaction.reply({ content: '⚙️ Este comando é um stub. Configuração avançada pode ser feita via config/config.json.', ephemeral: true });
  }
};

