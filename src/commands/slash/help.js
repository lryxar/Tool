'use strict';
const { SlashCommandBuilder } = require('discord.js');
const { embed } = require('../../utils/embeds');
module.exports = ({ config }) => ({
  data: new SlashCommandBuilder().setName('help').setDescription('عرض خارطة VELORA HUB'),
  async execute(interaction) {
    await interaction.reply({ embeds: [embed(config, '🚀 VELORA HUB V1.0.0', 'بوت Discord معياري مبني على discord.js v14 و SQLite.\n\n**V1:** أساس المشروع، قاعدة البيانات، تسجيل الأوامر، Handlers، Events، Permissions، Logging، Error Handler، Cache.\n**القادم:** Administration, Tickets, Customization, Ultimate Logs, Protection, Suggestions, Reviews, Tax, Giveaway, Welcome, Voice, Backup, Themes, Developer Tools, Localization, CI/CD, Docker, API.', 0x7828ff)] });
  }
});
