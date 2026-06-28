'use strict';

const { REST, Routes } = require('discord.js');
const { loadConfig } = require('../config');
const { loadSlashCommands } = require('./commandHandler');
const { createLogger } = require('../utils/logger');

async function main() {
  const config = loadConfig();
  const logger = createLogger('register');
  const commands = loadSlashCommands({ config, database: null, logger }).map(c => c.data.toJSON());
  const rest = new REST({ version: '10' }).setToken(config.discord.token);
  if (!config.discord.clientId || !config.discord.guildId) throw new Error('DISCORD_CLIENT_ID and DISCORD_GUILD_ID are required.');
  await rest.put(Routes.applicationGuildCommands(config.discord.clientId, config.discord.guildId), { body: commands });
  logger.info(`Registered ${commands.length} slash commands.`);
}

if (require.main === module) main().catch(error => { console.error(error); process.exit(1); });
module.exports = { main };
