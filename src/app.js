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
  const client = createClient({ commands });

  loadEvents(client, { config, database, commands, logger });

  process.once('SIGINT', () => shutdown(client, database, logger));
  process.once('SIGTERM', () => shutdown(client, database, logger));

  if (!config.discord.token) {
    throw new Error('Set DISCORD_TOKEN in your environment or config.json before starting VELORA HUB.');
  }

  await client.login(config.discord.token);
  return client;
}

function shutdown(client, database, logger) {
  logger.info('Shutting down VELORA HUB...');
  client.destroy();
  database.close?.();
  process.exit(0);
}

module.exports = { start };
