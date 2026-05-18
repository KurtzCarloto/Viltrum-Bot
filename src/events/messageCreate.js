const ticketManager = require('../handlers/ticketManager');

module.exports = {
  name: 'messageCreate',
  async execute(message) {
    if (!message.guild || message.author.bot) return;
    try {
      await ticketManager.recordMessage({ channelId: message.channel.id, message });
    } catch {
      // fail silently
    }
  }
};

