'use strict';

const { Client, Collection, GatewayIntentBits, Partials } = require('discord.js');

function createClient({ commands }) {
  const client = new Client({
    intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMembers, GatewayIntentBits.GuildMessages, GatewayIntentBits.GuildModeration, GatewayIntentBits.MessageContent, GatewayIntentBits.GuildVoiceStates],
    partials: [Partials.Channel, Partials.Message, Partials.GuildMember]
  });
  client.commands = new Collection(commands.map(command => [command.data.name, command]));
  return client;
}
module.exports = { createClient };
