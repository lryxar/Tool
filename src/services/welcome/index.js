'use strict';
const { embed } = require('../../utils/embeds');
async function sendWelcome(member, { config }) {
  if (!config.welcome.channelId) return;
  const channel = await member.guild.channels.fetch(config.welcome.channelId).catch(() => null);
  if (!channel) return;
  const message = embed(config, `👋 أهلًا بك في ${config.project.name}`, `نورت السيرفر يا ${member}.\n🎫 تحتاج مساعدة؟ افتح تذكرة وسيتم خدمتك بسرعة.`, 0x7828ff);
  if (config.welcome.image) message.setImage(config.welcome.image);
  await channel.send({ embeds: [message] });
}
module.exports = { sendWelcome };
