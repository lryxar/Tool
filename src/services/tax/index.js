'use strict';
const { embed } = require('../../utils/embeds');
async function handleTaxMessage(message, { config }) {
  if (message.channelId !== config.tax.channelId || !/^\d+$/.test(message.content.trim())) return;
  const amount = Number(message.content.trim());
  const tax = Math.ceil(amount * config.tax.rate);
  await message.reply({ embeds: [embed(config, '💳 ضريبة كريدت', `المبلغ: **${amount}**\nالضريبة: **${tax}**\nالإجمالي: **${amount + tax}**`, 0x38bdf8)] });
}
module.exports = { handleTaxMessage };
