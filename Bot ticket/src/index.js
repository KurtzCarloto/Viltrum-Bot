require('dotenv').config();

const { Client, GatewayIntentBits, Partials, Collection, Events } = require('discord.js');
const path = require('path');
const fs = require('fs');

const config = require('./config/loadConfig');
const { registerDatabase } = require('./database');

const express = require('express');
const http = require('http');

const { createApiServer } = require('./api');
const { createSocketServer } = require('./websocket');
const { computeServerStats } = require('./services/statsService');

const client = new Client({

  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMembers
  ],
  partials: [Partials.Channel]
});

client.commands = new Collection();

// Handlers (bootstrap)
const commandsPath = path.join(__dirname, 'commands');
const commandFolders = fs.existsSync(commandsPath) ? fs.readdirSync(commandsPath) : [];

for (const folder of commandFolders) {
  const folderPath = path.join(commandsPath, folder);
  if (!fs.existsSync(folderPath)) continue;
  const commandFiles = fs.readdirSync(folderPath).filter(f => f.endsWith('.js'));
  for (const file of commandFiles) {
    const filePath = path.join(folderPath, file);
    const cmd = require(filePath);
    if (!cmd || !cmd.data || !cmd.execute) continue;
    client.commands.set(cmd.data.name, cmd);
  }
}

// Simple interaction handler
client.on(Events.InteractionCreate, async (interaction) => {
  try {
    if (!interaction.isChatInputCommand()) return;

    const cmd = client.commands.get(interaction.commandName);
    if (!cmd) return;

    // Basic cooldown/permission checks can be implemented per-command.
    await cmd.execute(interaction, client);
  } catch (err) {
    console.error('Interaction error:', err);
    if (interaction && interaction.isRepliable && interaction.isRepliable()) {
      try {
        await interaction.editReply({ content: '❌ Ocorreu um erro ao executar este comando.' });
      } catch {
        try {
          await interaction.reply({ content: '❌ Ocorreu um erro ao executar este comando.', ephemeral: true });
        } catch {}
      }
    }
  }
});

// Deploy slash commands
async function deployCommands() {
  const { REST, Routes } = require('@discordjs/rest');
  const { default: fetch } = require('node-fetch');

  // node-fetch might not exist; keep deploy optional.
  // We'll just skip deploy if not available.
  return;
}

// HTTP + Socket.IO + API (Etapa 1)
const server = http.createServer(express);
const io = createSocketServer(server);

const PORT = process.env.PORT ? Number(process.env.PORT) : 3000;
createApiServer({ port: PORT, socket: io, client });

// Periodic stats push
async function pushStats() {
  try {
    const stats = await computeServerStats(client, config);
    io.emit('server-stats', stats);
  } catch (e) {
    // ignore
  }
}

client.once(Events.ClientReady, async () => {
  // listen HTTP only when ready
  server.listen(PORT, () => console.log(`[WEB] ready on :${PORT}`));
  await pushStats();
  setInterval(pushStats, 15000);
});

registerDatabase(client)
  .then(() => client.login(config.token))
  .catch((e) => {
    console.error('Database init failed:', e);
  });


