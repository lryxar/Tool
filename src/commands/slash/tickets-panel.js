'use strict';
const { ActionRowBuilder, ButtonBuilder, ButtonStyle, SlashCommandBuilder } = require('discord.js');
const { embed } = require('../../utils/embeds');

function buildButtons(types) {
  const buttons = [];
  if (types.includes('support')) buttons.push(new ButtonBuilder().setCustomId('ticket:open:support').setLabel('الدعم الفني').setEmoji('🎫').setStyle(ButtonStyle.Primary));
  if (types.includes('purchase')) buttons.push(new ButtonBuilder().setCustomId('ticket:open:purchase').setLabel('الشراء').setEmoji('🛒').setStyle(ButtonStyle.Success));
  return new ActionRowBuilder().addComponents(...buttons);
}

module.exports = ({ config }) => ({
  data: new SlashCommandBuilder().setName('tickets-panel').setDescription('إرسال لوحة تذاكر VELORA HUB'),
  panelTypes: ['support', 'purchase'],
  async execute(interaction) {
    await interaction.channel.send({ embeds: [embed(config, '✨ بوابة تذاكر VELORA HUB', 'اختر نوع التذكرة المناسب وسيتم إنشاء روم خاص لك مع فريق الدعم.', 0x7828ff)], components: [buildButtons(this.panelTypes || ['support', 'purchase'])] });
    await interaction.reply({ content: '✅ تم إرسال لوحة التذاكر.', ephemeral: true });
  }
});
