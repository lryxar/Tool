'use strict';

const fs = require('fs');
const path = require('path');

function loadSlashCommands(context) {
  const dir = path.join(__dirname, '../commands/slash');
  return fs.readdirSync(dir)
    .filter(file => file.endsWith('.js'))
    .map(file => require(path.join(dir, file))(context));
}
module.exports = { loadSlashCommands };
