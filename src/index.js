require('dotenv').config();

const { Client, GatewayIntentBits, Partials, Collection } = require('discord.js');
const path = require('path');
const fs = require('fs');

const config = require('./handlers/config');
const { initDb } = require('./database/init');

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
  ],
  partials: [Partials.Channel]
});

client.commands = new Collection();
client.cooldowns = new Map();

// Load handlers/events
const eventsPath = path.join(__dirname, 'events');
const handlersPath = path.join(__dirname, 'handlers');

// Commands loader (slash)
const commandsPath = path.join(__dirname, 'commands');
const commandFiles = fs.existsSync(commandsPath)
  ? fs.readdirSync(commandsPath).filter(f => f.endsWith('.js'))
  : [];

(async () => {
  await initDb();

  for (const file of commandFiles) {
    const cmd = require(path.join(commandsPath, file));
    if (!cmd?.data?.name) continue;
    client.commands.set(cmd.data.name, cmd);
  }

  // Register slash commands (per startup - you can replace with deploy script)
  const restDeploy = await require('./handlers/registerCommands')(client);
  await restDeploy;

  // Events
  const eventFiles = fs.existsSync(eventsPath)
    ? fs.readdirSync(eventsPath).filter(f => f.endsWith('.js'))
    : [];
  for (const file of eventFiles) {
    const event = require(path.join(eventsPath, file));
    if (event?.name && typeof event.execute === 'function') {
      client.on(event.name, (...args) => event.execute(...args, client));
    }
  }

  const token = config.token || process.env.TOKEN;
  if (!token) throw new Error('Token não configurado em config.json');
  client.login(token);
})();

