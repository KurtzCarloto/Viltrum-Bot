const { Collection } = require('discord.js');
const config = require('../config/loadConfig');

// Simple cooldown per user
const cd = new Collection();

function isOnCooldown(userId) {
  const now = Date.now();
  const cooldownMs = (config.antiSpam?.cooldownSeconds || 10) * 1000;
  const current = cd.get(userId);
  if (!current) return false;
  return now < current + cooldownMs;
}

function getCooldownRemaining(userId) {
  const now = Date.now();
  const cooldownMs = (config.antiSpam?.cooldownSeconds || 10) * 1000;
  const current = cd.get(userId) || 0;
  const remaining = current + cooldownMs - now;
  return Math.max(0, remaining);
}

function touch(userId) {
  cd.set(userId, Date.now());
}

module.exports = { isOnCooldown, getCooldownRemaining, touch };

