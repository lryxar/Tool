# VELORA HUB Discord Bot

بوت Discord باسم **VELORA HUB 2.0** بتصميم عربي احترافي ومناسب لـ Termux: هوية موحدة، تذاكر V2، إدارة، حماية، لوقات، نقاط، اقتراحات، ضريبة، تقييمات، Giveaway، تذكيرات، وترانسكربت TXT/HTML للتذاكر.

## يعمل على Termux للجوال

البوت بدون مكتبات خارجية، لذلك يناسب Termux على أندرويد طالما Node.js حديث متوفر.

```bash
pkg update -y
pkg install nodejs git -y
git clone <REPO_URL>
cd Tool
export DISCORD_TOKEN="BOT_TOKEN"
export DISCORD_CLIENT_ID="APPLICATION_ID"
export DISCORD_GUILD_ID="GUILD_ID"
npm start
```

> يحتاج إصدار Node.js يدعم `fetch`, `WebSocket`, `FormData`, و `Blob` المدمجة.

## الإعدادات

كل الإعدادات في `config.json`:

- اسم السيرفر: `VELORA HUB`
- روم الترحيب: `1519705672940388403`
- كاتجوري كل التذاكر: `1520477634822144060`
- `supportTicketCategoryId` و `purchaseTicketCategoryId` لفصل الدعم والشراء عند الحاجة.
- `supportStaffRoleId` و `purchaseStaffRoleId` لرولات مستقلة عند الحاجة.
- لوق التذاكر: `1520115836654981200`
- رتبة مسؤولي التذاكر: `1520110236051046490`
- روم الاقتراحات: `1519713973937766480`
- روم الضريبة: `1519712374892793996`
- روم التقييم: `1519708431857094757`
- حماية السبام/الروابط/المنشن/الرايد قابلة للتعديل.
- `serverBanner` يظهر أعلى بانل التذاكر، ويمكن تغييره لرابط بانر السيرفر.

## أوامر الإدارة والخدمات — تدعم `/` و `!`

- `!userinfo @user` معلومات عضو.
- `!serverinfo` معلومات السيرفر.
- `!avatar @user` صورة العضو.
- `!roleinfo @role` معلومات رتبة.
- `!channelinfo #channel` معلومات روم.
- `!slowmode 5` تغيير وضع التباطؤ.
- `!nickname @user الاسم` تغيير لقب عضو.
- `!move @user #voiceChannelId` نقل عضو إلى روم صوتي.
- `!mute @user` و `!unmute @user` عند ضبط `muteRoleId`.
- `!timeout @user 10` و `!untimeout @user`.
- `!kick @user`, `!ban @user`, `!unban USER_ID`.
- `!clear 50`, `!lock`, `!unlock`.
- `!warn @user السبب`, `!unwarn @user 1`, `!clearwarnings @user`.
- `!addrole @user @role`, `!removerole @user @role`.
- `!leaderboard` أو `/leaderboard` لوحة ترتيب النقاط.
- `!afk السبب` أو `/afk` تفعيل حالة AFK.
- `/banner`, `/emojiinfo`, `/membercount`, `/servericon`.
- `/voicekick`, `/voicemute`, `/voiceunmute`, `/hide`, `/unhide`.
- `/announce`, `/embed`, `/poll`, `/giveaway`, `/reroll`, `/remind`, `/resetpoints`.

كل أمر إداري ناجح يعطي المسؤول **0.5 نقطة**.

## أوامر السلاش — تبدأ بـ `/`

- `/help` لوحة الأوامر الجميلة.
- `/say` إرسال رسالة بإيمبد أو بدون.
- `/support-panel` بانل الدعم الفني فقط.
- `/purchase-panel` بانل الشراء فقط.
- `/tickets-panel` بانل شامل.
- `/ticket-claim` استلام التذكرة.
- `/ticket-close` إغلاق التذكرة مع حفظ Transcript TXT و HTML وإرسال طلب تقييم.
- `/ticket-add` إضافة عضو للتذكرة.
- `/ticket-remove` إزالة عضو من التذكرة.
- `/ticket-rename` تغيير اسم التذكرة.
- `/ticket-assign` تعيين التذكرة لموظف.
- `/ticket-unclaim` إلغاء الاستلام.
- `/ticket-transfer` تحويل نوع/كاتجوري التذكرة.
- `/ticket-reopen` إعادة فتح تذكرة مغلقة.
- `/warnings` عرض تحذيرات عضو.
- `/clearwarnings` حذف تحذيرات عضو.
- `/points` عرض النقاط.
- `/summon` استدعاء مبرمج أو رسام/مصمم أو مصمم سيرفرات.

## الأنظمة التلقائية

- **الترحيب:** إيمبد بعنوان `👋 أهلاً بك في VELORA HUB`، صورة العضو Thumbnail، وبانر الترحيب Image.
- **التذاكر V2:** معلومات المنشئ، وقت الفتح، رقم التذكرة، نوعها، أزرار استلام/إغلاق، منع تذكرتين من نفس النوع، تنظيف تلقائي عند حذف الروم، Transcript TXT/HTML، تقييم دعم 1–5، إعادة فتح وتحويل وتعيين موظف.
- **الاقتراحات:** يحذف رسالة العضو ويعيد نشرها بإيمبد وأزرار `✅ أوافق` و `❌ لا أوافق` و `🤔 محايد`.
- **التقييمات:** يعيد نشر التقييم بإيمبد منظم مع Timestamp.
- **الضريبة:** يعرض مبلغ التحويل، الضريبة، الإجمالي، ومع ضريبة الوسيط بتنسيق أرقام جميل ولون أزرق.
- **الحماية:** Anti Spam، Anti Link، Anti Mention Spam، Anti Everyone/Invite، Anti Raid/Mass Join، AFK، وتنبيهات تلقائية.
- **Logs:** حذف/تعديل الرسائل، دخول/خروج، Ban/Unban، حذف الرومات، فتح/إغلاق التذاكر.

## الصلاحيات المطلوبة

فعّل من Discord Developer Portal:

- Server Members Intent
- Message Content Intent

ويحتاج البوت صلاحيات إدارة الرومات، الرسائل، الرتب، الحظر، الطرد، التايم اوت، وقراءة الرسائل لإنشاء Transcript.
