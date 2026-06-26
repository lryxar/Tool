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
const state = fs.existsSync(DATA) ? JSON.parse(fs.readFileSync(DATA, 'utf8')) : { points: {}, warnings: {}, tickets: {}, counters: { support: 0, purchase: 0 } };
const save = () => fs.writeFileSync(DATA, JSON.stringify(state, null, 2));

const roleCache = new Map();

const commands = [
  { name: 'say', description: 'إرسال رسالة باسم البوت', options: [{ name: 'message', description: 'النص', type: 3, required: true }, { name: 'embed', description: 'داخل ايمبد؟', type: 5, required: false }, { name: 'channel', description: 'الروم', type: 7, required: false }] },
  { name: 'ticket-panel', description: 'إرسال بانل التذاكر' },
  { name: 'timeout', description: 'إعطاء تايم اوت', options: userReasonTime() },
  { name: 'untimeout', description: 'إلغاء تايم اوت', options: userReason() },
  { name: 'kick', description: 'طرد عضو', options: userReason() },
  { name: 'ban', description: 'حظر عضو', options: userReason() },
  { name: 'unban', description: 'إلغاء حظر', options: [{ name: 'user_id', description: 'آيدي العضو', type: 3, required: true }, { name: 'reason', description: 'السبب', type: 3 }] },
  { name: 'clear', description: 'حذف رسائل', options: [{ name: 'amount', description: 'العدد 1-100', type: 4, required: true }] },
  { name: 'lock', description: 'قفل الروم' }, { name: 'unlock', description: 'فتح الروم' },
  { name: 'warn', description: 'تحذير عضو', options: userReason() },
  { name: 'unwarn', description: 'إزالة تحذير', options: [{ name: 'user', description: 'العضو', type: 6, required: true }, { name: 'index', description: 'رقم التحذير', type: 4, required: true }] },
  { name: 'addrole', description: 'إعطاء رول', options: roleOptions() }, { name: 'removerole', description: 'إزالة رول', options: roleOptions() },
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
function hasRole(member, nameOrId) {
  const wanted = roleCache.get(nameOrId) || nameOrId;
  return member?.roles?.includes(wanted);
}
const opt = (i, n) => i.data.options?.find(o => o.name === n)?.value;
function embed(title, description, color = 0x7c3aed) { return { embeds: [{ title, description, color, timestamp: new Date().toISOString(), footer: { text: config.botName } }] }; }
async function reply(i, body, eph = true) { return api('POST', `/interactions/${i.id}/${i.token}/callback`, { type: 4, data: { flags: eph ? 64 : 0, ...body } }); }
async function editReply(i, body) { return api('PATCH', `/webhooks/${appId}/${i.token}/messages/@original`, body); }
function addPoint(id) { state.points[id] = +(Number(state.points[id] || 0) + 0.5).toFixed(1); save(); }
function canTicket(member) { return config.ticketAllowedRoleIds.some(r => member.roles.includes(r)); }

async function onInteraction(i) {
  try {
    if (i.type === 2) return command(i);
    if (i.type === 3) return component(i);
  } catch (e) { console.error(e); try { await reply(i, { content: `حدث خطأ: ${e.message}` }); } catch {} }
}
async function command(i) {
  const n = i.data.name, user = i.member.user.id, ch = i.channel_id;
  if (n === 'say') { const body = opt(i, 'embed') ? embed(config.botName, opt(i, 'message')) : { content: opt(i, 'message') }; await post(opt(i, 'channel') || ch, body); return reply(i, { content: 'تم الإرسال.' }); }
  if (n === 'ticket-panel') return sendTicketPanel(i);
  if (n === 'points') { const u = opt(i, 'user') || user; return reply(i, embed('نقاط الإدارة', `<@${u}> لديه **${state.points[u] || 0}** نقطة.`)); }
  if (n === 'summon') { const r = config.summonRoles[opt(i, 'type')]; return reply(i, { content: `<@&${r}> تم استدعاؤكم بواسطة <@${user}>`, allowed_mentions: { roles: [r], users: [user] } }, false); }
  const checks = { timeout: 'Timeout Manager', untimeout: 'Timeout Manager', kick: 'Kick Manager', ban: 'Ban Manager', unban: 'Ban Manager', clear: 'Chat Manager', lock: 'Chat Manager', unlock: 'Chat Manager', warn: 'Warning Manager', unwarn: 'Warning Manager', addrole: 'Role Manager', removerole: 'Role Manager' };
  if (checks[n] && !hasRole(i.member, checks[n])) return reply(i, { content: `تحتاج رتبة ${checks[n]}.` });
  await moderation(i, n); addPoint(user);
}
async function moderation(i, n) {
  const guild = i.guild_id, channel = i.channel_id, user = opt(i, 'user'), reason = opt(i, 'reason') || 'بدون سبب';
  if (n === 'timeout') await api('PATCH', `/guilds/${guild}/members/${user}`, { communication_disabled_until: new Date(Date.now() + opt(i, 'minutes') * 60000).toISOString() });
  if (n === 'untimeout') await api('PATCH', `/guilds/${guild}/members/${user}`, { communication_disabled_until: null });
  if (n === 'kick') await api('DELETE', `/guilds/${guild}/members/${user}?reason=${encodeURIComponent(reason)}`);
  if (n === 'ban') await api('PUT', `/guilds/${guild}/bans/${user}`, { delete_message_seconds: 0 });
  if (n === 'unban') await api('DELETE', `/guilds/${guild}/bans/${opt(i, 'user_id')}?reason=${encodeURIComponent(reason)}`);
  if (n === 'clear') { const msgs = await api('GET', `/channels/${channel}/messages?limit=${Math.min(100, Math.max(1, opt(i, 'amount')))}`); await api('POST', `/channels/${channel}/messages/bulk-delete`, { messages: msgs.map(m => m.id) }); }
  if (n === 'lock' || n === 'unlock') await api('PUT', `/channels/${channel}/permissions/${i.guild_id}`, { type: 0, deny: n === 'lock' ? '2048' : '0', allow: n === 'unlock' ? '2048' : '0' });
  if (n === 'warn') { (state.warnings[user] ||= []).push({ by: i.member.user.id, reason, at: Date.now() }); save(); }
  if (n === 'unwarn') { state.warnings[user]?.splice(opt(i, 'index') - 1, 1); save(); }
  if (n === 'addrole') await api('PUT', `/guilds/${guild}/members/${user}/roles/${opt(i, 'role')}`);
  if (n === 'removerole') await api('DELETE', `/guilds/${guild}/members/${user}/roles/${opt(i, 'role')}`);
  await reply(i, embed('تم تنفيذ الأمر', `الأمر: **/${n}**\nالمسؤول: <@${i.member.user.id}>\nالسبب: ${reason}`));
}
async function sendTicketPanel(i) { await post(i.channel_id, { embeds: [{ title: '🎫 تذاكر VELORA HUB', description: 'اختر نوع التذكرة من الأزرار بالأسفل.', color: 0x2dd4bf }], components: [{ type: 1, components: [{ type: 2, style: 1, custom_id: 'ticket:support', label: 'الدعم الفني', emoji: { name: '🎫' } }, { type: 2, style: 3, custom_id: 'ticket:purchase', label: 'شراء', emoji: { name: '🛒' } }] }] }); return reply(i, { content: 'تم إرسال بانل التذاكر.' }); }
async function component(i) {
  const id = i.data.custom_id;
  if (id.startsWith('ticket:')) return openTicket(i, id.split(':')[1]);
  const [, action, owner] = id.split(':');
  if (action === 'claim') return reply(i, embed('استلام التذكرة', `تم الاستلام بواسطة <@${i.member.user.id}>`), false);
  if (action === 'close') { await reply(i, { content: 'سيتم حذف التذكرة خلال 5 ثواني.' }); setTimeout(() => api('DELETE', `/channels/${i.channel_id}`).catch(console.error), 5000); return; }
}
async function openTicket(i, type) {
  if (!canTicket(i.member)) return reply(i, { content: 'لا تملك رتبة مسموحة لفتح التذاكر.' });
  const key = `${i.guild_id}:${i.member.user.id}:${type}`; if (state.tickets[key]) return reply(i, { content: 'لديك تذكرة مفتوحة من هذا النوع.' });
  const num = ++state.counters[type]; const name = `${type}-${num}-${i.member.user.username}`.toLowerCase().replace(/[^a-z0-9-]/g, '-').slice(0, 90);
  const channel = await api('POST', `/guilds/${i.guild_id}/channels`, { name, type: 0, parent_id: config.ticketCategoryId, permission_overwrites: [{ id: i.guild_id, type: 0, deny: '1024' }, { id: i.member.user.id, type: 1, allow: '3072' }, { id: config.ticketStaffRoleId, type: 0, allow: '3072' }] });
  state.tickets[key] = channel.id; save();
  await post(channel.id, { content: `<@${i.member.user.id}> <@&${config.ticketStaffRoleId}>`, embeds: [{ title: type === 'support' ? 'تذكرة دعم فني' : 'تذكرة شراء', description: 'اشرح طلبك بوضوح وسيتم خدمتك قريبًا.', color: 0x22c55e }], components: [{ type: 1, components: [{ type: 2, style: 2, custom_id: `ticketctl:claim:${i.member.user.id}`, label: 'استلام' }, { type: 2, style: 4, custom_id: `ticketctl:close:${i.member.user.id}`, label: 'حذف/إغلاق' }] }] });
  await post(config.ticketLogChannelId, embed('Ticket Log', `فتح <@${i.member.user.id}> تذكرة ${type}: <#${channel.id}>`));
  return reply(i, { content: `تم فتح تذكرتك: <#${channel.id}>` });
}
async function onMessage(m) {
  if (m.author.bot) return;
  if (m.channel_id === config.suggestionsChannelId) { await api('DELETE', `/channels/${m.channel_id}/messages/${m.id}`); const msg = await post(m.channel_id, embed('اقتراح جديد', `من: <@${m.author.id}>\n\n${m.content}`, 0xf59e0b)); await api('PUT', `/channels/${m.channel_id}/messages/${msg.id}/reactions/✅/@me`); await api('PUT', `/channels/${m.channel_id}/messages/${msg.id}/reactions/❌/@me`); }
  if (m.channel_id === config.taxChannelId && /^\d+$/.test(m.content.trim())) { const amount = Number(m.content.trim()); const tax = Math.ceil(amount * 0.0526316); const total = amount + tax; const broker = Math.ceil(total * 1.0526316); await post(m.channel_id, embed('ضــريــبــة كــريــدت', `**💳 الـمـبـلـغ** : **__${amount}__**\n\n**💰 الـضـريـبـة** :\n**__${tax}__**\n\n**💵 الـمـبـلـغ مـع الـضـريـبـة** :\n**__${total}__**\n\n**💵 الـمـبـلـغ مـع ضـريـبـة الـوسـيـط**\n**__${broker}__**`, 0x38bdf8)); }
  if (m.channel_id === config.reviewChannelId) { await api('DELETE', `/channels/${m.channel_id}/messages/${m.id}`); await post(m.channel_id, embed('⭐ تقييم جديد', `المقيّم: <@${m.author.id}>\n\n${m.content}`, 0xfacc15)); }
}
async function onMemberAdd(d) { await post(config.welcomeChannelId, { embeds: [{ title: 'أهلًا وسهلًا بك!', description: 'نرحب بانضمامك إلى VELORA HUB\n\n📖 يرجى قراءة القوانين أولًا.\n\n🎫 إذا احتجت أي مساعدة، افتح تذكرة أو تواصل مع الإدارة.', image: { url: config.welcomeImage }, color: 0x7c3aed, timestamp: new Date().toISOString(), footer: { text: config.botName } }] }); }

async function register() {
  if (guildId) {
    try {
      const roles = await api('GET', `/guilds/${guildId}/roles`);
      for (const role of roles) roleCache.set(role.name, role.id);
    } catch (e) { console.warn('Could not cache guild roles:', e.message); }
  }
  if (appId && guildId) await api('PUT', `/applications/${appId}/guilds/${guildId}/commands`, commands);
}
function connect() { const ws = new WebSocket('wss://gateway.discord.gg/?v=10&encoding=json'); let hb; ws.onmessage = async ev => { const p = JSON.parse(ev.data); if (p.op === 10) { hb = setInterval(() => ws.send(JSON.stringify({ op: 1, d: null })), p.d.heartbeat_interval); ws.send(JSON.stringify({ op: 2, d: { token, intents: 33283, properties: { os: process.platform, browser: 'velora-hub', device: 'velora-hub' } } })); } if (p.t === 'INTERACTION_CREATE') await onInteraction(p.d); if (p.t === 'MESSAGE_CREATE') await onMessage(p.d); if (p.t === 'GUILD_MEMBER_ADD') await onMemberAdd(p.d); }; ws.onclose = () => { clearInterval(hb); setTimeout(connect, 5000); }; }
register().then(connect).catch(e => { console.error(e); connect(); });
