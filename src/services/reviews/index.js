'use strict';
const { embed } = require('../../utils/embeds');
async function handleReviewMessage(message, { config }) {
  if (message.channelId !== config.reviews.channelId) return;
  await message.delete().catch(() => null);
  await message.channel.send({ embeds: [embed(config, '⭐ تقييم جديد', `${message.content}\n\nالمقيّم: ${message.author}`, 0xfacc15)] });
}
module.exports = { handleReviewMessage };
