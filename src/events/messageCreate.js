'use strict';
const { handleTaxMessage } = require('../services/tax');
const { handleSuggestionMessage } = require('../services/suggestions');
const { handleReviewMessage } = require('../services/reviews');
module.exports = context => ({
  name: 'messageCreate',
  async execute(message) {
    if (message.author.bot) return;
    await handleTaxMessage(message, context);
    await handleSuggestionMessage(message, context);
    await handleReviewMessage(message, context);
  }
});
