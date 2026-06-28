'use strict';

const fs = require('fs');
const path = require('path');

function loadEvents(client, context) {
  const dir = path.join(__dirname, '../events');
  for (const file of fs.readdirSync(dir).filter(name => name.endsWith('.js'))) {
    const event = require(path.join(dir, file))(context);
    client[event.once ? 'once' : 'on'](event.name, (...args) => event.execute(...args, client));
  }
}
module.exports = { loadEvents };
