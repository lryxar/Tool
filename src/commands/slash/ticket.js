'use strict';
const { SlashCommandBuilder } = require('discord.js');
const tickets = require('../../services/tickets');

module.exports = ({ config, database }) => ({
  data: new SlashCommandBuilder()
    .setName('ticket')
    .setDescription('إدارة التذكرة الحالية')
    .addSubcommand(s => s.setName('claim').setDescription('استلام التذكرة الحالية'))
    .addSubcommand(s => s.setName('close').setDescription('إغلاق التذكرة الحالية').addStringOption(o => o.setName('reason').setDescription('سبب الإغلاق')))
    .addSubcommand(s => s.setName('rename').setDescription('تغيير اسم التذكرة').addStringOption(o => o.setName('name').setDescription('الاسم الجديد').setRequired(true)))
    .addSubcommand(s => s.setName('add').setDescription('إضافة عضو للتذكرة').addUserOption(o => o.setName('user').setDescription('العضو').setRequired(true)))
    .addSubcommand(s => s.setName('remove').setDescription('إزالة عضو من التذكرة').addUserOption(o => o.setName('user').setDescription('العضو').setRequired(true))),
  async execute(interaction) {
    const action = interaction.options.getSubcommand();
    return tickets.handleTicketCommand(interaction, { config, database, action });
  }
});
