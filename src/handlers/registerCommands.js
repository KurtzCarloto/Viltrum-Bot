const path = require('path');
const { REST, Routes } = require('discord.js');
const config = require('./config');
const fs = require('fs');

module.exports = async (client) => {
  // Gather command JSON
  const commandsDir = path.join(__dirname, '..', 'commands');
  const commandFiles = fs.readdirSync(commandsDir).filter(f => f.endsWith('.js'));

  const commandData = [];
  for (const file of commandFiles) {
    const cmd = require(path.join(commandsDir, file));
    if (cmd?.data) commandData.push(cmd.data.toJSON());
  }

  const rest = new REST({ version: '10' }).setToken(config.token || process.env.TOKEN);

  try {
    console.log(`[Deploy] Registrando ${commandData.length} comandos...`);
    await rest.put(
      Routes.applicationCommands(config.clientId || process.env.CLIENT_ID, undefined),
      { body: commandData }
    );
    console.log('[Deploy] Comandos registrados com sucesso.');
  } catch (e) {
    console.error('[Deploy] Falha ao registrar comandos:', e);
  }
};

