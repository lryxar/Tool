'use strict';
module.exports = ({ logger }) => ({
  name: 'ready', once: true,
  execute(client) {
    logger.info(`Logged in as ${client.user.tag}`);
    client.user.setPresence({ activities: [{ name: 'VELORA HUB • /help' }], status: 'online' });
  }
});
