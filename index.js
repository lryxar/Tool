'use strict';

const fs = require('fs');
const path = require('path');
const config = require('./config.json');

const token = process.env.DISCORD_TOKEN;
const appId = process.env.DISCORD_CLIENT_ID;
const guildId = process.env.DISCORD_GUILD_ID;
if (!token) throw new Error('Set DISCORD_TOKEN before starting VELORA HUB bot.');

const API = 'https://discord.com/api/v10';
const DATA = path.join(__dirname, 'data.json');
const DEFAULT_STATE = { points: {}, warnings: {}, tickets: {}, ticketMeta: {}, closedTickets: {}, counters: { support: 0, purchase: 0 }, afk: {}, protection: { spam: {}, joins: [] } };
const state = fs.existsSync(DATA) ? { ...DEFAULT_STATE, ...JSON.parse(fs.readFileSync(DATA, 'utf8')) } : DEFAULT_STATE;
const save = () => fs.writeFileSync(DATA, JSON.stringify(state, null, 2));
const roleCache = new Map();

const COLORS = { main: config.accentColor || 0x7828ff, ok: 0x22c55e, warn: 0xf59e0b, danger: 0xef4444, info: 0x38bdf8, gold: 0xfacc15 };
const PERMS = { ViewChannel: 1024n, SendMessages: 2048n, ReadMessageHistory: 65536n, AttachFiles: 32768n };
const ticketTypes = {
  support: { label: 'الدعم الفني', emoji: '🛠', color: COLORS.info, prefix: 'support', intro: 'اشرح المشكلة بالتفصيل.\n\nكلما كانت المعلومات أوضح،\nكان حل المشكلة أسرع.' },
  purchase: { label: 'الشراء', emoji: '🛒', color: COLORS.ok, prefix: 'buy', intro: 'يرجى إرسال:\n\n• المنتج\n• الكمية\n• طريقة الدفع\n\nوسيتم خدمتك بأسرع وقت.' }
};

const commands = [
  { name: 'help', description: 'عرض لوحة أوامر VELORA HUB' },
  { name: 'say', description: 'إرسال رسالة باسم البوت', options: [{ name: 'message', description: 'النص', type: 3, required: true }, { name: 'embed', description: 'إرسال داخل إيمبد', type: 5 }, { name: 'channel', description: 'الروم', type: 7 }] },
  { name: 'support-panel', description: 'إرسال بانل الدعم الفني فقط' },
  { name: 'purchase-panel', description: 'إرسال بانل الشراء فقط' },
  { name: 'tickets-panel', description: 'إرسال بانل شامل للدعم والشراء' },
  { name: 'ticket-claim', description: 'استلام التذكرة الحالية' },
  { name: 'ticket-close', description: 'إغلاق التذكرة الحالية', options: [{ name: 'reason', description: 'سبب الإغلاق', type: 3 }] },
  { name: 'ticket-add', description: 'إضافة عضو للتذكرة', options: [{ name: 'user', description: 'العضو', type: 6, required: true }] },
  { name: 'ticket-remove', description: 'إزالة عضو من التذكرة', options: [{ name: 'user', description: 'العضو', type: 6, required: true }] },
  { name: 'ticket-rename', description: 'تغيير اسم التذكرة', options: [{ name: 'name', description: 'الاسم الجديد', type: 3, required: true }] },
  { name: 'ticket-assign', description: 'تعيين التذكرة لموظف', options: [{ name: 'staff', description: 'الموظف', type: 6, required: true }] },
  { name: 'ticket-reopen', description: 'إعادة فتح تذكرة مغلقة', options: [{ name: 'ticket_id', description: 'رقم/آيدي التذكرة المغلقة', type: 3, required: true }] },
  { name: 'warnings', description: 'عرض تحذيرات عضو', options: [{ name: 'user', description: 'العضو', type: 6, required: true }] },
  { name: 'clearwarnings', description: 'حذف كل تحذيرات عضو', options: [{ name: 'user', description: 'العضو', type: 6, required: true }] },
  { name: 'points', description: 'عرض نقاطك أو نقاط عضو', options: [{ name: 'user', description: 'العضو', type: 6 }] },
  { name: 'summon', description: 'استدعاء رتبة خدمة', options: [{ name: 'type', description: 'النوع', type: 3, required: true, choices: [{ name: 'مبرمج', value: 'programmer' }, { name: 'رسام/مصمم', value: 'artist' }, { name: 'مصمم سيرفرات', value: 'serverDesigner' }] }] }
];
function userReason() { return [{ name: 'user', description: 'العضو', type: 6, required: true }, { name: 'reason', description: 'السبب', type: 3 }]; }
function userReasonTime() { return [...userReason(), { name: 'minutes', description: 'الدقائق', type: 4, required: true }]; }
function roleOptions() { return [{ name: 'user', description: 'العضو', type: 6, required: true }, { name: 'role', description: 'الرول', type: 8, required: true }]; }

async function api(method, route, body) {
  const res = await fetch(`${API}${route}`, { method, headers: { Authorization: `Bot ${token}`, 'Content-Type': 'application/json' }, body: body ? JSON.stringify(body) : undefined });
  if (!res.ok) throw new Error(`${method} ${route}: ${res.status} ${await res.text()}`);
  return res.status === 204 ? null : res.json();
}
const post = (channel, body) => api('POST', `/channels/${channel}/messages`, body);

async function uploadText(channelId, filename, content, payload = {}) {
  const form = new FormData();
  form.append('payload_json', JSON.stringify(payload));
  form.append('files[0]', new Blob([content], { type: 'text/plain;charset=utf-8' }), filename);
  const res = await fetch(`${API}/channels/${channelId}/messages`, { method: 'POST', headers: { Authorization: `Bot ${token}` }, body: form });
  if (!res.ok) throw new Error(`UPLOAD ${channelId}: ${res.status} ${await res.text()}`);
  return res.json();
}
async function fetchTranscript(channelId) {
  const messages = await api('GET', `/channels/${channelId}/messages?limit=100`).catch(() => []);
  return messages.reverse().map(m => `[${m.timestamp}] ${m.author?.username || 'Unknown'} (${m.author?.id || '0'}): ${m.content || ''}`).join('\n');
}
const opt = (i, n) => i.data.options?.find(o => o.name === n)?.value;
const bit = (...values) => values.reduce((sum, v) => sum | v, 0n).toString();
const cleanName = value => String(value || 'ticket').toLowerCase().replace(/[^a-z0-9-]/g, '-').replace(/-+/g, '-').slice(0, 90);
const fmt = number => Number(number).toLocaleString('en-US');
function hasRole(member, nameOrId) { return member?.roles?.includes(roleCache.get(nameOrId) || nameOrId); }
function canUseTickets(member) { return hasRole(member, config.ticketStaffRoleId) || config.ticketAllowedRoleIds.some(r => member.roles.includes(r)); }
function isTicketStaff(member) { return hasRole(member, config.ticketStaffRoleId); }
function addPoint(id) { state.points[id] = +(Number(state.points[id] || 0) + 0.5).toFixed(1); save(); }
function makeEmbed(title, description, color = COLORS.main, fields = []) { return { title, description, color, fields, timestamp: new Date().toISOString(), footer: { text: `${config.serverName} • VELORA HUB` } }; }
function fancyLine() { return '━━━━━━━━━━━━━━━━━━━━'; }
async function reply(i, body, eph = true) { return api('POST', `/interactions/${i.id}/${i.token}/callback`, { type: 4, data: { flags: eph ? 64 : 0, ...body } }); }
async function logTicket(title, description, color = COLORS.info) { return post(config.ticketLogChannelId, { embeds: [makeEmbed(title, description, color)] }).catch(console.error); }

async function onInteraction(i) {
  try {
    if (i.type === 2) return command(i);
    if (i.type === 3) return component(i);
  } catch (e) {
    console.error(e);
    try { await reply(i, { embeds: [makeEmbed('⚠️ حدث خطأ', `\`${e.message.slice(0, 900)}\``, COLORS.danger)] }); } catch {}
  }
}
async function command(i) {
  const name = i.data.name;
  if (name === 'help') return reply(i, helpPayload(), false);
  if (name === 'say') return sayCommand(i);
  if (name === 'support-panel') return sendTicketPanel(i, 'support');
  if (name === 'purchase-panel') return sendTicketPanel(i, 'purchase');
  if (name === 'tickets-panel') return sendTicketPanel(i, 'all');
  if (name.startsWith('ticket-')) return ticketCommand(i, name);
  if (name === 'points') return pointsCommand(i);
  if (name === 'summon') return summonCommand(i);
  if (name === 'warnings') return warningsCommand(i);
  if (name === 'clearwarnings') return clearWarningsCommand(i);

  const checks = { timeout: 'Timeout Manager', untimeout: 'Timeout Manager', kick: 'Kick Manager', ban: 'Ban Manager', unban: 'Ban Manager', clear: 'Chat Manager', lock: 'Chat Manager', unlock: 'Chat Manager', warn: 'Warning Manager', unwarn: 'Warning Manager', addrole: 'Role Manager', removerole: 'Role Manager' };
  if (checks[name] && !hasRole(i.member, checks[name])) return reply(i, { embeds: [makeEmbed('صلاحية غير كافية', `تحتاج رتبة **${checks[name]}** لاستخدام هذا الأمر.`, COLORS.danger)] });
  await moderation(i, name);
  addPoint(i.member.user.id);
}
async function sayCommand(i) {
  const message = opt(i, 'message');
  const body = opt(i, 'embed') ? { embeds: [makeEmbed(`📢 إعلان ${config.serverName}`, message, COLORS.main)] } : { content: message };
  await post(opt(i, 'channel') || i.channel_id, body);
  return reply(i, { embeds: [makeEmbed('تم الإرسال', 'تم إرسال الرسالة بالشكل المطلوب.', COLORS.ok)] });
}
function helpPayload() {
  return { embeds: [makeEmbed(`✨ لوحة أوامر ${config.serverName}`, `${fancyLine()}\n**بوت منظم للترحيب، التذاكر، الإدارة، النقاط، الاقتراحات، الضريبة والتقييمات.**`, COLORS.main, [
    { name: '🎫 التذاكر', value: '`/support-panel` `/purchase-panel` `/ticket-claim` `/ticket-close` `/ticket-add` `/ticket-remove` `/ticket-rename`' },
    { name: '🛡️ الإدارة', value: '`!timeout` `!kick` `!ban` `!clear` `!lock` `!warn` `!addrole` `!leaderboard`' },
    { name: '⭐ الخدمات', value: '`/say` `/points` `/warnings` `/summon` `!afk`' }
  ])] };
}
async function pointsCommand(i) {
  const user = opt(i, 'user') || i.member.user.id;
  return reply(i, { embeds: [makeEmbed('🏆 نقاط الإدارة', `المستخدم: <@${user}>\nالنقاط الحالية: **${state.points[user] || 0}**`, COLORS.gold)] });
}
async function leaderboardCommand(i) {
  const top = Object.entries(state.points).sort((a, b) => b[1] - a[1]).slice(0, 10);
  const text = top.length ? top.map(([id, pts], idx) => `**${idx + 1}.** <@${id}> — **${pts}** نقطة`).join('\n') : 'لا توجد نقاط حتى الآن.';
  return reply(i, { embeds: [makeEmbed('🏅 توب الإداريين', text, COLORS.gold)] }, false);
}
async function summonCommand(i) {
  const roleId = config.summonRoles[opt(i, 'type')];
  return reply(i, { content: `<@&${roleId}>`, embeds: [makeEmbed('📣 استدعاء خدمة', `تم استدعاء الفريق بواسطة <@${i.member.user.id}>`, COLORS.info)], allowed_mentions: { roles: [roleId], users: [i.member.user.id] } }, false);
}
async function warningsCommand(i) {
  const user = opt(i, 'user');
  const list = state.warnings[user] || [];
  const text = list.length ? list.map((w, idx) => `**${idx + 1}.** بواسطة <@${w.by}> — ${w.reason}`).join('\n') : 'لا توجد تحذيرات.';
  return reply(i, { embeds: [makeEmbed('📋 سجل التحذيرات', `<@${user}>\n\n${text}`, COLORS.warn)] });
}
async function clearWarningsCommand(i) {
  const user = opt(i, 'user');
  state.warnings[user] = []; save();
  return reply(i, { embeds: [makeEmbed('🧹 تم حذف التحذيرات', `تم حذف جميع تحذيرات <@${user}>.`, COLORS.ok)] });
}
async function moderation(i, name) {
  const guild = i.guild_id, channel = i.channel_id, user = opt(i, 'user'), reason = opt(i, 'reason') || 'بدون سبب';
  if (name === 'timeout') await api('PATCH', `/guilds/${guild}/members/${user}`, { communication_disabled_until: new Date(Date.now() + opt(i, 'minutes') * 60000).toISOString() });
  if (name === 'untimeout') await api('PATCH', `/guilds/${guild}/members/${user}`, { communication_disabled_until: null });
  if (name === 'kick') await api('DELETE', `/guilds/${guild}/members/${user}?reason=${encodeURIComponent(reason)}`);
  if (name === 'ban') await api('PUT', `/guilds/${guild}/bans/${user}`, { delete_message_seconds: 0 });
  if (name === 'unban') await api('DELETE', `/guilds/${guild}/bans/${opt(i, 'user_id')}?reason=${encodeURIComponent(reason)}`);
  if (name === 'clear') { const msgs = await api('GET', `/channels/${channel}/messages?limit=${Math.min(100, Math.max(1, opt(i, 'amount')))}`); await api('POST', `/channels/${channel}/messages/bulk-delete`, { messages: msgs.map(m => m.id) }); }
  if (name === 'lock' || name === 'unlock') await api('PUT', `/channels/${channel}/permissions/${guild}`, { type: 0, deny: name === 'lock' ? PERMS.SendMessages.toString() : '0', allow: name === 'unlock' ? PERMS.SendMessages.toString() : '0' });
  if (name === 'warn') { (state.warnings[user] ||= []).push({ by: i.member.user.id, reason, at: Date.now() }); save(); }
  if (name === 'unwarn') { state.warnings[user]?.splice(opt(i, 'index') - 1, 1); save(); }
  if (name === 'addrole') await api('PUT', `/guilds/${guild}/members/${user}/roles/${opt(i, 'role')}`);
  if (name === 'removerole') await api('DELETE', `/guilds/${guild}/members/${user}/roles/${opt(i, 'role')}`);
  await reply(i, { embeds: [makeEmbed('✅ تم تنفيذ الأمر', `**الأمر:** /${name}\n**المسؤول:** <@${i.member.user.id}>\n**السبب:** ${reason}\n**النقاط:** +0.5`, COLORS.ok)] });
}

async function sendTicketPanel(i, type) {
  const panels = type === 'all' ? ['support', 'purchase'] : [type];
  const components = [{ type: 1, components: panels.map(t => ({ type: 2, style: t === 'support' ? 1 : 3, custom_id: `ticket:open:${t}`, label: ticketTypes[t].label, emoji: { name: ticketTypes[t].emoji } })) }];
  const title = type === 'purchase' ? '🛒 بوابة تذاكر الشراء' : type === 'support' ? '🎫 بوابة الدعم الفني' : '✨ بوابة تذاكر VELORA HUB';
  const description = `مرحبًا بك في نظام التذاكر الخاص بـ **${config.serverName}**.\n\nاختر نوع التذكرة المناسب من الأزرار أدناه.\n\n🛒 شراء\n🛠 دعم فني\n\nيرجى عدم فتح أكثر من تذكرة لنفس الغرض.`;
  const panelEmbed = makeEmbed(title, description, COLORS.main);
  if (config.serverBanner) panelEmbed.image = { url: config.serverBanner };
  await post(i.channel_id, { embeds: [panelEmbed], components });
  return reply(i, { embeds: [makeEmbed('تم إرسال البانل', 'تم تجهيز البانل بشكل منفصل ومنظم.', COLORS.ok)] });
}
async function component(i) {
  const parts = i.data.custom_id.split(':');
  if (parts[0] === 'ticket' && parts[1] === 'open') return openTicket(i, parts[2]);
  if (parts[0] === 'ticketctl' && parts[1] === 'claim') return claimTicket(i);
  if (parts[0] === 'ticketctl' && parts[1] === 'close') return closeTicket(i, 'تم الإغلاق من الزر');
}
async function ticketCommand(i, name) {
  if (!isTicketStaff(i.member) && name !== 'ticket-close') return reply(i, { embeds: [makeEmbed('صلاحية غير كافية', `هذه الأوامر مخصصة لمسؤولي التذاكر <@&${config.ticketStaffRoleId}>.`, COLORS.danger)] });
  if (name === 'ticket-claim') return claimTicket(i);
  if (name === 'ticket-close') return closeTicket(i, opt(i, 'reason') || 'بدون سبب');
  if (name === 'ticket-add' || name === 'ticket-remove') {
    const allow = name === 'ticket-add' ? bit(PERMS.ViewChannel, PERMS.SendMessages, PERMS.ReadMessageHistory, PERMS.AttachFiles) : '0';
    const deny = name === 'ticket-remove' ? PERMS.ViewChannel.toString() : '0';
    await api('PUT', `/channels/${i.channel_id}/permissions/${opt(i, 'user')}`, { type: 1, allow, deny });
    return reply(i, { embeds: [makeEmbed(name === 'ticket-add' ? '➕ تمت الإضافة' : '➖ تمت الإزالة', `العضو: <@${opt(i, 'user')}>`, COLORS.ok)] });
  }
  if (name === 'ticket-rename') {
    await api('PATCH', `/channels/${i.channel_id}`, { name: cleanName(opt(i, 'name')) });
    return reply(i, { embeds: [makeEmbed('✏️ تم تغيير الاسم', `الاسم الجديد: **${cleanName(opt(i, 'name'))}**`, COLORS.ok)] });
  }
}
async function openTicket(i, type) {
  if (!canUseTickets(i.member)) return reply(i, { embeds: [makeEmbed('غير مسموح', 'لا تملك رتبة مسموحة لفتح التذاكر.', COLORS.danger)] });
  const meta = ticketTypes[type];
  const key = `${i.guild_id}:${i.member.user.id}:${type}`;
  if (state.tickets[key]) return reply(i, { embeds: [makeEmbed('لديك تذكرة مفتوحة', `تذكرتك الحالية: <#${state.tickets[key]}>`, COLORS.warn)] });
  const number = ++state.counters[type];
  const name = cleanName(`${meta.prefix}-${String(number).padStart(4, '0')}-${i.member.user.username}`);
  const allowTicket = bit(PERMS.ViewChannel, PERMS.SendMessages, PERMS.ReadMessageHistory, PERMS.AttachFiles);
  const channel = await api('POST', `/guilds/${i.guild_id}/channels`, { name, type: 0, parent_id: config.ticketCategoryId, permission_overwrites: [{ id: i.guild_id, type: 0, deny: PERMS.ViewChannel.toString() }, { id: i.member.user.id, type: 1, allow: allowTicket }, { id: config.ticketStaffRoleId, type: 0, allow: allowTicket }] });
  state.tickets[key] = channel.id; save();
  await post(channel.id, { content: `<@${i.member.user.id}> <@&${config.ticketStaffRoleId}>`, embeds: [makeEmbed(`${meta.emoji} ${meta.label} #${number}`, `${fancyLine()}\n${meta.intro}\n\n**صاحب التذكرة:** <@${i.member.user.id}>\n**النوع:** ${meta.label}\n**الحالة:** مفتوحة`, meta.color)], components: [{ type: 1, components: [{ type: 2, style: 2, custom_id: 'ticketctl:claim', label: 'استلام التذكرة', emoji: { name: '🙋' } }, { type: 2, style: 4, custom_id: 'ticketctl:close', label: 'إغلاق التذكرة', emoji: { name: '🔒' } }] }] });
  await logTicket('📥 فتح تذكرة', `العضو: <@${i.member.user.id}>\nالنوع: **${meta.label}**\nالروم: <#${channel.id}>`, meta.color);
  return reply(i, { embeds: [makeEmbed('تم فتح التذكرة', `تفضل: <#${channel.id}>`, COLORS.ok)] });
}
async function claimTicket(i) {
  if (!isTicketStaff(i.member)) return reply(i, { embeds: [makeEmbed('صلاحية غير كافية', 'فقط مسؤولو التذاكر يستطيعون استلام التذاكر.', COLORS.danger)] });
  await logTicket('🙋 استلام تذكرة', `الروم: <#${i.channel_id}>\nالمستلم: <@${i.member.user.id}>`, COLORS.ok);
  return reply(i, { embeds: [makeEmbed('🙋 تم استلام التذكرة', `المسؤول: <@${i.member.user.id}>\nسيتم مساعدتك الآن.`, COLORS.ok)] }, false);
}
async function closeTicket(i, reason) {
  const meta = state.ticketMeta[i.channel_id] || {};
  const entry = Object.entries(state.tickets).find(([, channelId]) => channelId === i.channel_id);
  const transcript = await fetchTranscript(i.channel_id);
  const closedId = `${meta.type || 'ticket'}-${meta.number || Date.now()}`;
  state.closedTickets[closedId] = { ...meta, closedAt: Date.now(), closedBy: i.member.user.id, reason, transcript };
  if (entry) delete state.tickets[entry[0]];
  delete state.ticketMeta[i.channel_id]; save();
  await uploadText(config.ticketLogChannelId, `${closedId}.txt`, transcript || 'No transcript', { embeds: [makeEmbed('📄 Transcript التذكرة', `التذكرة: **${closedId}**\nالمنشئ: ${meta.ownerId ? `<@${meta.ownerId}>` : 'غير معروف'}\nأغلقها: <@${i.member.user.id}>\nالسبب: ${reason}`, COLORS.info)] }).catch(console.error);
  await logTicket('🔒 إغلاق تذكرة', `الروم: <#${i.channel_id}>\nبواسطة: <@${i.member.user.id}>\nالسبب: ${reason}\nملف التذكرة: **${closedId}.txt**`, COLORS.danger);
  if (meta.ownerId) await sendRatingRequest(meta.ownerId, closedId).catch(console.error);
  await reply(i, { embeds: [makeEmbed('🔒 تم إغلاق التذكرة بنجاح', `شكراً لاستخدامك نظام **${config.serverName}**.\n\nسيتم حذف التذكرة خلال **5 ثوانٍ**.`, COLORS.danger)] }, false);
  setTimeout(() => api('DELETE', `/channels/${i.channel_id}`).catch(console.error), 5000);
}
async function sendRatingRequest(userId, ticketId) {
  const dm = await api('POST', `/users/@me/channels`, { recipient_id: userId });
  return post(dm.id, { embeds: [makeEmbed('⭐ تقييم الدعم', `تم إغلاق تذكرتك **${ticketId}**.\nقيّم تجربة الدعم من 1 إلى 5 نجوم.`, COLORS.gold)], components: [{ type: 1, components: [1, 2, 3, 4, 5].map(n => ({ type: 2, style: 2, custom_id: `rate:${ticketId}:${n}`, label: `${n} ⭐` })) }] });
}
async function reopenTicket(i, ticketId) {
  const old = state.closedTickets[ticketId];
  if (!old) return reply(i, { embeds: [makeEmbed('غير موجود', 'لم أجد تذكرة مغلقة بهذا الرقم.', COLORS.danger)] });
  const meta = ticketTypes[old.type] || ticketTypes.support;
  const allowTicket = bit(PERMS.ViewChannel, PERMS.SendMessages, PERMS.ReadMessageHistory, PERMS.AttachFiles);
  const channel = await api('POST', `/guilds/${i.guild_id}/channels`, { name: cleanName(`reopen-${ticketId}`), type: 0, parent_id: config.ticketCategoryId, permission_overwrites: [{ id: i.guild_id, type: 0, deny: PERMS.ViewChannel.toString() }, { id: old.ownerId, type: 1, allow: allowTicket }, { id: config.ticketStaffRoleId, type: 0, allow: allowTicket }] });
  const key = `${i.guild_id}:${old.ownerId}:${old.type}`;
  state.tickets[key] = channel.id; state.ticketMeta[channel.id] = { ...old, key, reopenedAt: Date.now() }; save();
  await post(channel.id, { content: `<@${old.ownerId}> <@&${config.ticketStaffRoleId}>`, embeds: [makeEmbed(`♻️ إعادة فتح ${meta.label}`, `تمت إعادة فتح التذكرة **${ticketId}**.`, meta.color)] });
  return reply(i, { embeds: [makeEmbed('♻️ تم إعادة الفتح', `الروم الجديد: <#${channel.id}>`, COLORS.ok)] });
}

function parseMentionId(value) { return String(value || '').replace(/[<@!#&>]/g, ''); }
async function prefixCommand(m) {
  if (!m.content.startsWith('!')) return false;
  const [raw, ...args] = m.content.slice(1).trim().split(/\s+/);
  const cmd = raw?.toLowerCase();
  const target = parseMentionId(args[0] || m.author.id);
  const member = m.member || {};
  const need = role => hasRole(member, role);
  const deny = () => post(m.channel_id, { embeds: [makeEmbed('صلاحية غير كافية', 'هذا الأمر إداري ويحتاج رتبة مناسبة.', COLORS.danger)] });
  if (cmd === 'afk') { state.afk[m.author.id] = { reason: args.join(' ') || 'AFK', at: Date.now() }; save(); return post(m.channel_id, { embeds: [makeEmbed('💤 AFK', `<@${m.author.id}> أصبح AFK.\nالسبب: ${state.afk[m.author.id].reason}`, COLORS.info)] }); }
  if (cmd === 'leaderboard') { const top = Object.entries(state.points).sort((a,b)=>b[1]-a[1]).slice(0,10); return post(m.channel_id, { embeds: [makeEmbed('🏅 توب الإداريين', top.map(([id,p],i)=>`**${i+1}.** <@${id}> — **${p}** نقطة`).join('\n') || 'لا توجد نقاط.', COLORS.gold)] }); }
  if (['userinfo','avatar'].includes(cmd)) { const user = await api('GET', `/users/${target}`).catch(() => null); if (!user) return; const avatar = user.avatar ? `https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.png?size=1024` : null; const e = makeEmbed(cmd === 'avatar' ? '🖼️ Avatar' : '👤 معلومات عضو', `العضو: <@${user.id}>\nالآيدي: \`${user.id}\``, COLORS.info); if (avatar) e.image = { url: avatar }; return post(m.channel_id, { embeds: [e] }); }
  if (cmd === 'serverinfo') return post(m.channel_id, { embeds: [makeEmbed('🏰 معلومات السيرفر', `السيرفر: **${config.serverName}**\nالآيدي: \`${m.guild_id}\``, COLORS.main)] });
  if (cmd === 'roleinfo') return post(m.channel_id, { embeds: [makeEmbed('🎭 معلومات رتبة', `الرتبة: <@&${parseMentionId(args[0])}>\nالآيدي: \`${parseMentionId(args[0])}\``, COLORS.info)] });
  if (cmd === 'channelinfo') return post(m.channel_id, { embeds: [makeEmbed('📌 معلومات روم', `الروم: <#${parseMentionId(args[0] || m.channel_id)}>\nالآيدي: \`${parseMentionId(args[0] || m.channel_id)}\``, COLORS.info)] });
  if (cmd === 'timeout') { if (!need('Timeout Manager')) return deny(); await api('PATCH', `/guilds/${m.guild_id}/members/${target}`, { communication_disabled_until: new Date(Date.now() + (Number(args[1]) || 10) * 60000).toISOString() }); addPoint(m.author.id); return post(m.channel_id, { embeds: [makeEmbed('⏱️ Timeout', `تم إعطاء تايم اوت لـ <@${target}>.`, COLORS.ok)] }); }
  if (cmd === 'untimeout') { if (!need('Timeout Manager')) return deny(); await api('PATCH', `/guilds/${m.guild_id}/members/${target}`, { communication_disabled_until: null }); addPoint(m.author.id); return post(m.channel_id, { embeds: [makeEmbed('✅ UnTimeout', `تم إلغاء التايم اوت عن <@${target}>.`, COLORS.ok)] }); }
  if (cmd === 'kick') { if (!need('Kick Manager')) return deny(); await api('DELETE', `/guilds/${m.guild_id}/members/${target}`); addPoint(m.author.id); return post(m.channel_id, { embeds: [makeEmbed('👢 Kick', `تم طرد <@${target}>.`, COLORS.ok)] }); }
  if (cmd === 'ban') { if (!need('Ban Manager')) return deny(); await api('PUT', `/guilds/${m.guild_id}/bans/${target}`, { delete_message_seconds: 0 }); addPoint(m.author.id); return post(m.channel_id, { embeds: [makeEmbed('🔨 Ban', `تم حظر <@${target}>.`, COLORS.ok)] }); }
  if (cmd === 'unban') { if (!need('Ban Manager')) return deny(); await api('DELETE', `/guilds/${m.guild_id}/bans/${target}`); addPoint(m.author.id); return post(m.channel_id, { embeds: [makeEmbed('🔓 Unban', `تم إلغاء حظر ${target}.`, COLORS.ok)] }); }
  if (cmd === 'clear') { if (!need('Chat Manager')) return deny(); const msgs = await api('GET', `/channels/${m.channel_id}/messages?limit=${Math.min(100, Math.max(1, Number(args[0]) || 1))}`); await api('POST', `/channels/${m.channel_id}/messages/bulk-delete`, { messages: msgs.map(x => x.id) }); addPoint(m.author.id); return post(m.channel_id, { embeds: [makeEmbed('🧹 Clear', 'تم حذف الرسائل.', COLORS.ok)] }); }
  if (cmd === 'lock' || cmd === 'unlock') { if (!need('Chat Manager')) return deny(); await api('PUT', `/channels/${m.channel_id}/permissions/${m.guild_id}`, { type: 0, deny: cmd === 'lock' ? PERMS.SendMessages.toString() : '0', allow: cmd === 'unlock' ? PERMS.SendMessages.toString() : '0' }); addPoint(m.author.id); return post(m.channel_id, { embeds: [makeEmbed(cmd === 'lock' ? '🔒 Lock' : '🔓 Unlock', 'تم تنفيذ الأمر.', COLORS.ok)] }); }
  if (cmd === 'warn') { if (!need('Warning Manager')) return deny(); (state.warnings[target] ||= []).push({ by: m.author.id, reason: args.slice(1).join(' ') || 'بدون سبب', at: Date.now() }); save(); addPoint(m.author.id); return post(m.channel_id, { embeds: [makeEmbed('⚠️ Warn', `تم تحذير <@${target}>.`, COLORS.warn)] }); }
  if (cmd === 'unwarn') { if (!need('Warning Manager')) return deny(); state.warnings[target]?.splice((Number(args[1]) || 1) - 1, 1); save(); addPoint(m.author.id); return post(m.channel_id, { embeds: [makeEmbed('✅ Unwarn', `تم إزالة تحذير من <@${target}>.`, COLORS.ok)] }); }
  if (cmd === 'addrole' || cmd === 'removerole') { if (!need('Role Manager')) return deny(); const roleId = parseMentionId(args[1]); await api(cmd === 'addrole' ? 'PUT' : 'DELETE', `/guilds/${m.guild_id}/members/${target}/roles/${roleId}`); addPoint(m.author.id); return post(m.channel_id, { embeds: [makeEmbed('🎭 Role', `تم تنفيذ الأمر على <@${target}>.`, COLORS.ok)] }); }
  if (cmd === 'slowmode') { if (!need('Chat Manager')) return deny(); await api('PATCH', `/channels/${m.channel_id}`, { rate_limit_per_user: Math.max(0, Number(args[0]) || 0) }); return post(m.channel_id, { embeds: [makeEmbed('🐢 Slowmode', `تم ضبط التباطؤ إلى **${Number(args[0]) || 0}** ثانية.`, COLORS.ok)] }); }
  if (cmd === 'nickname') { if (!need('Role Manager')) return deny(); await api('PATCH', `/guilds/${m.guild_id}/members/${target}`, { nick: args.slice(1).join(' ') || null }); return post(m.channel_id, { embeds: [makeEmbed('✏️ Nickname', `تم تعديل لقب <@${target}>.`, COLORS.ok)] }); }
  if (cmd === 'move') { if (!need('Chat Manager')) return deny(); await api('PATCH', `/guilds/${m.guild_id}/members/${target}`, { channel_id: parseMentionId(args[1]) }); return post(m.channel_id, { embeds: [makeEmbed('🔊 Move', `تم نقل <@${target}>.`, COLORS.ok)] }); }
  if (cmd === 'mute' || cmd === 'unmute') { if (!need('Timeout Manager')) return deny(); if (!config.muteRoleId) return post(m.channel_id, { embeds: [makeEmbed('إعداد ناقص', 'ضع آيدي رتبة الميوت في config.json داخل muteRoleId.', COLORS.warn)] }); const route = `/guilds/${m.guild_id}/members/${target}/roles/${config.muteRoleId}`; await api(cmd === 'mute' ? 'PUT' : 'DELETE', route); return post(m.channel_id, { embeds: [makeEmbed(cmd === 'mute' ? '🔇 Mute' : '🔊 Unmute', `تم تنفيذ الأمر على <@${target}>.`, COLORS.ok)] }); }
  if (cmd === 'clearwarnings') { if (!need('Warning Manager')) return deny(); state.warnings[target] = []; save(); return post(m.channel_id, { embeds: [makeEmbed('🧹 Clear Warnings', `تم حذف تحذيرات <@${target}>.`, COLORS.ok)] }); }
  return false;
}
async function protection(m) {
  if (!m.guild_id || m.author.bot || m.content.startsWith('!')) return;
  const now = Date.now();
  const bucket = (state.protection.spam[m.author.id] ||= []).filter(t => now - t < config.antiSpamWindowMs);
  bucket.push(now); state.protection.spam[m.author.id] = bucket;
  const hasLink = /(https?:\/\/|discord\.gg\/|discord\.com\/invite\/)/i.test(m.content);
  const mentions = (m.mentions?.length || 0) + (m.mention_roles?.length || 0);
  if (bucket.length > config.antiSpamMaxMessages || hasLink || mentions >= config.antiMentionLimit) {
    await api('DELETE', `/channels/${m.channel_id}/messages/${m.id}`).catch(() => {});
    await post(m.channel_id, { embeds: [makeEmbed('🛡️ حماية VELORA', `<@${m.author.id}> تم حذف رسالة مخالفة لنظام الحماية.`, COLORS.danger)] }).catch(() => {});
  }
  if (state.afk[m.author.id]) { delete state.afk[m.author.id]; save(); await post(m.channel_id, { embeds: [makeEmbed('👋 رجعت من AFK', `<@${m.author.id}> تم إزالة حالة AFK.`, COLORS.ok)] }).catch(() => {}); }
}

async function onMessage(m) {
  if (m.author.bot) return;
  if (await prefixCommand(m)) return;
  await protection(m);
  if (m.channel_id === config.suggestionsChannelId) {
    await api('DELETE', `/channels/${m.channel_id}/messages/${m.id}`);
    await post(m.channel_id, { embeds: [makeEmbed('💡 اقتراح جديد', `**صاحب الاقتراح**\n<@${m.author.id}>\n\n━━━━━━━━━━━━━━\n**الاقتراح:**\n${m.content}\n━━━━━━━━━━━━━━\n\nصوت برأيك باستخدام الأزرار.`, COLORS.warn)], components: [{ type: 1, components: [{ type: 2, style: 3, custom_id: 'suggest:yes', label: 'أوافق', emoji: { name: '✅' } }, { type: 2, style: 4, custom_id: 'suggest:no', label: 'لا أوافق', emoji: { name: '❌' } }, { type: 2, style: 2, custom_id: 'suggest:neutral', label: 'محايد', emoji: { name: '🤔' } }] }] });
  const entry = Object.entries(state.tickets).find(([, channelId]) => channelId === i.channel_id);
  if (entry) { delete state.tickets[entry[0]]; save(); }
  await logTicket('🔒 إغلاق تذكرة', `الروم: <#${i.channel_id}>\nبواسطة: <@${i.member.user.id}>\nالسبب: ${reason}`, COLORS.danger);
  await reply(i, { embeds: [makeEmbed('🔒 إغلاق التذكرة', `سيتم حذف الروم خلال **5 ثواني**.\nالسبب: ${reason}`, COLORS.danger)] }, false);
  setTimeout(() => api('DELETE', `/channels/${i.channel_id}`).catch(console.error), 5000);
}

async function onMessage(m) {
  if (m.author.bot) return;
  if (m.channel_id === config.suggestionsChannelId) {
    await api('DELETE', `/channels/${m.channel_id}/messages/${m.id}`);
    const msg = await post(m.channel_id, { embeds: [makeEmbed('💡 اقتراح جديد', `${fancyLine()}\n${m.content}\n\n**صاحب الاقتراح:** <@${m.author.id}>`, COLORS.warn)] });
    await api('PUT', `/channels/${m.channel_id}/messages/${msg.id}/reactions/✅/@me`);
    await api('PUT', `/channels/${m.channel_id}/messages/${msg.id}/reactions/❌/@me`);
  }
  if (m.channel_id === config.taxChannelId && /^\d+$/.test(m.content.trim())) {
    const amount = Number(m.content.trim());
    const tax = Math.ceil(amount * 0.0526316);
    const total = amount + tax;
    const broker = Math.ceil(total * 1.0526316);
    await post(m.channel_id, { embeds: [makeEmbed('💳 ضــريــبــة كــريــدت', `**💰 مبلغ التحويل**\n${fmt(amount)}\n\n**💸 الضريبة**\n${fmt(tax)}\n\n**💵 الإجمالي**\n${fmt(total)}\n\n**🏦 مع ضريبة الوسيط**\n${fmt(broker)}`, COLORS.info)] });
  }
  if (m.channel_id === config.reviewChannelId) {
    await api('DELETE', `/channels/${m.channel_id}/messages/${m.id}`);
    await post(m.channel_id, { embeds: [makeEmbed('⭐ تقييم جديد', `**المقيّم**\n<@${m.author.id}>\n\n━━━━━━━━━━━━━━\n**التقييم**\n${m.content}`, COLORS.gold)] });
  }
}
async function onMemberAdd(d) {
  const now = Date.now();
  state.protection.joins = (state.protection.joins || []).filter(t => now - t < config.antiRaidWindowMs);
  state.protection.joins.push(now); save();
  if (state.protection.joins.length >= config.antiRaidJoins) {
    await post(config.ticketLogChannelId, { embeds: [makeEmbed('🚨 Anti Raid', `تم رصد دخول جماعي: **${state.protection.joins.length}** أعضاء خلال ثواني.`, COLORS.danger)] }).catch(console.error);
  }
  const welcome = makeEmbed(`👋 أهلاً بك في ${config.serverName}`, `مرحبًا بك <@${d.user.id}>
يسعدنا انضمامك إلى مجتمع **${config.serverName}** 💜
📖 اقرأ القوانين أولًا.
🎫 إذا احتجت مساعدة افتح تذكرة.
💬 استمتع بوقتك ونتمنى لك تجربة رائعة.

أنت العضو رقم **${d.guild?.member_count || 'غير معروف'}**`, COLORS.main);
  welcome.footer = { text: `${config.serverName} • Welcome System` };
  if (d.user.avatar) welcome.thumbnail = { url: `https://cdn.discordapp.com/avatars/${d.user.id}/${d.user.avatar}.png?size=256` };
  welcome.image = { url: config.welcomeImage };
  await post(config.welcomeChannelId, { embeds: [welcome], allowed_mentions: { users: [d.user.id] } });
}


async function register() {
  if (guildId) {
    try {
      const roles = await api('GET', `/guilds/${guildId}/roles`);
      for (const role of roles) roleCache.set(role.name, role.id);
    } catch (e) { console.warn('Could not cache guild roles:', e.message); }
  }
  if (appId && guildId) await api('PUT', `/applications/${appId}/guilds/${guildId}/commands`, commands);
}
function connect() {
  const ws = new WebSocket('wss://gateway.discord.gg/?v=10&encoding=json');
  let heartbeat;
  ws.onmessage = async event => {
    const payload = JSON.parse(event.data);
    if (payload.op === 10) {
      heartbeat = setInterval(() => ws.send(JSON.stringify({ op: 1, d: null })), payload.d.heartbeat_interval);
      ws.send(JSON.stringify({ op: 2, d: { token, intents: 33283, properties: { os: process.platform, browser: 'velora-hub-termux', device: 'velora-hub-termux' } } }));
    }
    if (payload.t === 'INTERACTION_CREATE') await onInteraction(payload.d);
    if (payload.t === 'MESSAGE_CREATE') await onMessage(payload.d);
    if (payload.t === 'GUILD_MEMBER_ADD') await onMemberAdd(payload.d);
  };
  ws.onclose = () => { clearInterval(heartbeat); setTimeout(connect, 5000); };
  ws.onerror = error => console.error('Gateway error:', error.message || error);
}
register().then(connect).catch(error => { console.error(error); connect(); });
