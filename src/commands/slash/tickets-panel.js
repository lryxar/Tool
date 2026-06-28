'use strict';
const { ActionRowBuilder, ButtonBuilder, ButtonStyle, SlashCommandBuilder } = require('discord.js');
const { embed } = require('../../utils/embeds');
module.exports = ({ config }) => ({
  data: new SlashCommandBuilder().setName('tickets-panel').setDescription('إرسال لوحة تذاكر VELORA HUB'),
  async execute(interaction) {
    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId('ticket:open:support').setLabel('الدعم الفني').setEmoji('🎫').setStyle(ButtonStyle.Primary),
      new ButtonBuilder().setCustomId('ticket:open:purchase').setLabel('الشراء').setEmoji('🛒').setStyle(ButtonStyle.Success)
    );
    await interaction.channel.send({ embeds: [embed(config, '✨ بوابة تذاكر VELORA HUB', 'اختر نوع التذكرة المناسب وسيتم إنشاء روم خاص لك مع فريق الدعم.', 0x7828ff)], components: [row] });
    await interaction.reply({ content: '✅ تم إرسال لوحة التذاكر.', ephemeral: true });
  }
});
