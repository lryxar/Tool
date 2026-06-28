'use strict';
const { sendWelcome } = require('../services/welcome');
module.exports = context => ({ name: 'guildMemberAdd', execute(member) { return sendWelcome(member, context); } });
