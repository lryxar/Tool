'use strict';

const { createClient } = require('./handlers/client');
const { loadConfig } = require('./config');
const { createDatabase } = require('./database');
const { loadEvents } = require('./handlers/eventHandler');
const { loadSlashCommands } = require('./handlers/commandHandler');
const { createLogger } = require('./utils/logger');

async function start() {
  const config = loadConfig();
  const logger = createLogger(config.project.botName);
  const database = await createDatabase(config.database);
  const commands = loadSlashCommands({ config, database, logger });
  const client = createClient({ config, database, commands, logger });

  loadEvents(client, { config, database, commands, logger });

  if (!config.discord.token) {
    throw new Error('Set DISCORD_TOKEN in your environment or config.json before starting VELORA HUB.');
  }

  await client.login(config.discord.token);
  return client;
}

module.exports = { start };
