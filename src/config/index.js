'use strict';

const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '../..');
const json = name => {
  const file = path.join(root, name);
  if (!fs.existsSync(file)) return {};
  return JSON.parse(fs.readFileSync(file, 'utf8'));
};

function loadConfig() {
  const base = json('config.json');
  return {
    project: { name: 'VELORA HUB', botName: 'VELORA HUB', version: '1.0.0', language: 'JavaScript (Node.js)', discordApi: 'discord.js v14', ...base.project },
    discord: { token: process.env.DISCORD_TOKEN || base.token, clientId: process.env.DISCORD_CLIENT_ID || base.clientId, guildId: process.env.DISCORD_GUILD_ID || base.guildId },
    owners: json('owners.json'),
    permissions: json('permissions.json'),
    panels: json('panels.json'),
    tickets: { categoryId: base.ticketCategoryId, staffRoleId: base.ticketStaffRoleId, allowedRoleIds: base.ticketAllowedRoleIds || [], logChannelId: base.ticketLogChannelId, ...json('tickets.json') },
    logs: json('logs.json'),
    welcome: { channelId: base.welcomeChannelId, image: base.welcomeImage, ...json('welcome.json') },
    tax: { channelId: base.taxChannelId, rate: 0.0526316, ...json('tax.json') },
    reviews: { channelId: base.reviewChannelId, ...json('reviews.json') },
    suggestions: { channelId: base.suggestionsChannelId, ...json('suggestions.json') },
    themes: { active: 'purple', accentColor: base.accentColor || 0x7828ff, ...json('themes.json') },
    backup: json('backup.json'),
    database: { driver: 'sqlite', file: path.join(root, 'src/storage/velora.sqlite'), ...json('database.json') },
    security: json('security.json'),
    summonRoles: base.summonRoles || {}
  };
}

module.exports = { loadConfig };
