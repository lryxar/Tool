'use strict';

const { EmbedBuilder } = require('discord.js');

function embed(config, title, description, color) {
  return new EmbedBuilder()
    .setTitle(title)
    .setDescription(description)
    .setColor(color || config.themes.accentColor || 0x7828ff)
    .setTimestamp()
    .setFooter({ text: `${config.project.name} • VELORA HUB` });
}
module.exports = { embed };
