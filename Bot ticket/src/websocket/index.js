const { Server } = require('socket.io');

function createSocketServer(httpServer) {
  const io = new Server(httpServer, {
    cors: { origin: '*', methods: ['GET', 'POST'] }
  });

  io.on('connection', (socket) => {
    socket.emit('bot-status', { botStatus: 'online' });
  });

  return io;
}

module.exports = { createSocketServer };

