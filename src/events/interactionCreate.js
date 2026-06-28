'use strict';
const { handleTicketButton } = require('../services/tickets');
module.exports = ({ config, database, logger }) => ({
  name: 'interactionCreate',
  async execute(interaction) {
    try {
      if (interaction.isChatInputCommand()) {
        const command = interaction.client.commands.get(interaction.commandName);
        if (!command) return;
        return command.execute(interaction);
      }
      if (interaction.isButton() && interaction.customId.startsWith('ticket:')) {
        return handleTicketButton(interaction, { config, database });
      }
    } catch (error) {
      logger.error(error);
      const payload = { content: '⚠️ حدث خطأ أثناء تنفيذ العملية.', ephemeral: true };
      if (interaction.replied || interaction.deferred) await interaction.followUp(payload); else await interaction.reply(payload);
    }
  }
});
