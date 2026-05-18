const path = require('path');
const { Database } = require('./sqlite');

let db;

async function registerDatabase(client) {
  db = new Database({
    filename: path.join(__dirname, '..', '..', 'database.sqlite')
  });

  await db.init();
  client.db = db;
  return db;
}

module.exports = { registerDatabase };

