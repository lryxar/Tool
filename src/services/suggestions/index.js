'use strict';
const { embed } = require('../../utils/embeds');
async function handleSuggestionMessage(message, { config }) {
  if (message.channelId !== config.suggestions.channelId) return;
  await message.delete().catch(() => null);
  const sent = await message.channel.send({ embeds: [embed(config, '💡 اقتراح جديد', `${message.content}\n\nصاحب الاقتراح: ${message.author}`, 0xf59e0b)] });
  await sent.react('✅'); await sent.react('❌');
}
module.exports = { handleSuggestionMessage };
