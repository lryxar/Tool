'use strict';
const { ChannelType, PermissionFlagsBits, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const { embed } = require('../../utils/embeds');

const ticketPermissions = [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ReadMessageHistory, PermissionFlagsBits.AttachFiles];

function safeChannelName(value) {
  return String(value || 'ticket').toLowerCase().replace(/[^a-z0-9-]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '').slice(0, 90) || 'ticket';
}

function canManageTicket(interaction, config) {
  if (!config.tickets.staffRoleId) return true;
  return interaction.member?.roles?.cache?.has(config.tickets.staffRoleId);
}

async function getOpenTicket(database, guildId, ownerId, type) {
  return database.get('SELECT channel_id FROM tickets WHERE guild_id = ? AND owner_id = ? AND type = ? AND status = ?', [guildId, ownerId, type, 'open']);
}

async function handleTicketButton(interaction, { config, database }) {
  const [, action, type] = interaction.customId.split(':');
  if (action === 'open') return openTicket(interaction, { config, database, type });
  if (action === 'claim') return handleTicketCommand(interaction, { config, database, action: 'claim' });
  if (action === 'close') return handleTicketCommand(interaction, { config, database, action: 'close' });
}

async function openTicket(interaction, { config, database, type }) {
  const ticketType = ['support', 'purchase'].includes(type) ? type : 'support';
  const existing = await getOpenTicket(database, interaction.guildId, interaction.user.id, ticketType);
  if (existing) return interaction.reply({ content: `لديك تذكرة مفتوحة بالفعل: <#${existing.channel_id}>`, ephemeral: true });

  const label = ticketType === 'purchase' ? 'الشراء' : 'الدعم الفني';
  const overwrites = [
    { id: interaction.guildId, deny: [PermissionFlagsBits.ViewChannel] },
    { id: interaction.user.id, allow: ticketPermissions }
  ];
  if (config.tickets.staffRoleId) overwrites.push({ id: config.tickets.staffRoleId, allow: ticketPermissions });

  const channel = await interaction.guild.channels.create({
    name: safeChannelName(`${ticketType}-${interaction.user.username}`),
    type: ChannelType.GuildText,
    parent: config.tickets.categoryId || null,
    permissionOverwrites: overwrites,
    reason: `VELORA HUB ticket opened by ${interaction.user.tag}`
  });

  await database.run('INSERT INTO tickets (guild_id, channel_id, owner_id, type, created_at) VALUES (?, ?, ?, ?, ?)', [interaction.guildId, channel.id, interaction.user.id, ticketType, Date.now()]);
  const controls = new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId('ticket:claim').setLabel('استلام').setEmoji('🙋').setStyle(ButtonStyle.Secondary),
    new ButtonBuilder().setCustomId('ticket:close').setLabel('إغلاق').setEmoji('🔒').setStyle(ButtonStyle.Danger)
  );
  await channel.send({ content: `<@${interaction.user.id}>`, embeds: [embed(config, `🎫 تذكرة ${label}`, 'اشرح طلبك بالتفصيل وسيقوم الفريق بمساعدتك قريبًا.', 0x38bdf8)], components: [controls] });
  await interaction.reply({ content: `✅ تم فتح التذكرة: ${channel}`, ephemeral: true });
}

async function handleTicketCommand(interaction, { config, database, action }) {
  const ticket = await database.get('SELECT * FROM tickets WHERE guild_id = ? AND channel_id = ? AND status = ?', [interaction.guildId, interaction.channelId, 'open']);
  if (!ticket) return interaction.reply({ content: 'هذه القناة ليست تذكرة مفتوحة.', ephemeral: true });
  if (action !== 'close' && !canManageTicket(interaction, config)) return interaction.reply({ content: 'لا تملك صلاحية إدارة التذاكر.', ephemeral: true });

  if (action === 'claim') {
    await database.run('UPDATE tickets SET claimed_by = ? WHERE channel_id = ?', [interaction.user.id, interaction.channelId]);
    return interaction.reply({ embeds: [embed(config, '🙋 تم استلام التذكرة', `المسؤول: ${interaction.user}`, 0x22c55e)] });
  }
  if (action === 'close') {
    const reason = interaction.options?.getString?.('reason') || 'بدون سبب';
    await database.run('UPDATE tickets SET status = ?, closed_at = ? WHERE channel_id = ?', ['closed', Date.now(), interaction.channelId]);
    await interaction.reply({ embeds: [embed(config, '🔒 إغلاق التذكرة', `سيتم حذف القناة خلال 5 ثواني.\nالسبب: ${reason}`, 0xef4444)] });
    return setTimeout(() => interaction.channel.delete(`VELORA HUB ticket closed: ${reason}`).catch(() => null), 5000);
  }
  if (action === 'rename') {
    const name = safeChannelName(interaction.options.getString('name'));
    await interaction.channel.setName(name, `VELORA HUB ticket renamed by ${interaction.user.tag}`);
    return interaction.reply({ content: `✅ تم تغيير اسم التذكرة إلى **${name}**.`, ephemeral: true });
  }
  if (action === 'add' || action === 'remove') {
    const user = interaction.options.getUser('user');
    await interaction.channel.permissionOverwrites.edit(user.id, action === 'add' ? { ViewChannel: true, SendMessages: true, ReadMessageHistory: true, AttachFiles: true } : { ViewChannel: false });
    return interaction.reply({ content: `✅ تم ${action === 'add' ? 'إضافة' : 'إزالة'} ${user}.`, ephemeral: true });
  }
}

module.exports = { handleTicketButton, handleTicketCommand, openTicket };
