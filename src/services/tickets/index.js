'use strict';
const { ChannelType, PermissionFlagsBits } = require('discord.js');
const { embed } = require('../../utils/embeds');

async function handleTicketButton(interaction, { config, database }) {
  const [, action, type] = interaction.customId.split(':');
  if (action !== 'open') return;
  const existing = await database.get('SELECT channel_id FROM tickets WHERE guild_id = ? AND owner_id = ? AND type = ? AND status = ?', [interaction.guildId, interaction.user.id, type, 'open']);
  if (existing) return interaction.reply({ content: `لديك تذكرة مفتوحة بالفعل: <#${existing.channel_id}>`, ephemeral: true });
  const label = type === 'purchase' ? 'الشراء' : 'الدعم الفني';
  const channel = await interaction.guild.channels.create({
    name: `${type}-${interaction.user.username}`.toLowerCase().replace(/[^a-z0-9-]/g, '-').slice(0, 90),
    type: ChannelType.GuildText,
    parent: config.tickets.categoryId || null,
    permissionOverwrites: [
      { id: interaction.guildId, deny: [PermissionFlagsBits.ViewChannel] },
      { id: interaction.user.id, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ReadMessageHistory, PermissionFlagsBits.AttachFiles] },
      ...(config.tickets.staffRoleId ? [{ id: config.tickets.staffRoleId, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ReadMessageHistory] }] : [])
    ]
  });
  await database.run('INSERT INTO tickets (guild_id, channel_id, owner_id, type, created_at) VALUES (?, ?, ?, ?, ?)', [interaction.guildId, channel.id, interaction.user.id, type, Date.now()]);
  await channel.send({ content: `<@${interaction.user.id}>`, embeds: [embed(config, `🎫 تذكرة ${label}`, 'اشرح طلبك بالتفصيل وسيقوم الفريق بمساعدتك قريبًا.', 0x38bdf8)] });
  await interaction.reply({ content: `✅ تم فتح التذكرة: ${channel}`, ephemeral: true });
}
module.exports = { handleTicketButton };
