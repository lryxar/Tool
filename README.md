# VELORA HUB Discord Bot

بوت Discord باسم **VELORA HUB** بتصميم مرتب ومناسب للسيرفر: ترحيب أسطوري، تذاكر منفصلة للدعم والشراء، إدارة، نقاط، اقتراحات، ضريبة، تقييمات، واستدعاء فرق الخدمات.

## يعمل على Termux للجوال

البوت لا يستخدم أي مكتبات خارجية، لذلك يناسب Termux على أندرويد طالما Node.js حديث متوفر.

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

> ملاحظة: يحتاج Node.js يدعم `fetch` و `WebSocket` المدمجين. إذا كان إصدار Node في Termux قديمًا، حدّث حزمة `nodejs`.

## التشغيل على أي جهاز

```bash
export DISCORD_TOKEN="BOT_TOKEN"
export DISCORD_CLIENT_ID="APPLICATION_ID"
export DISCORD_GUILD_ID="GUILD_ID"
npm start
```

عند التشغيل يسجل البوت أوامر السلاش داخل السيرفر المحدد في `DISCORD_GUILD_ID`.

## الإعدادات

كل آيديات الرومات والرتب الأساسية موجودة في `config.json`:

- اسم السيرفر: `VELORA HUB`
- روم الترحيب: `1519705672940388403`
- كاتجوري كل التذاكر: `1520477634822144060`
- لوق التذاكر: `1520115836654981200`
- رتبة مسؤولي التذاكر: `1520110236051046490`
- روم الاقتراحات: `1519713973937766480`
- روم الضريبة: `1519712374892793996`
- روم التقييم: `1519708431857094757`

## أوامر التذاكر

- `/support-panel` يرسل بانل الدعم الفني فقط.
- `/purchase-panel` يرسل بانل الشراء فقط.
- `/tickets-panel` يرسل بانل شامل للنوعين.
- `/ticket-claim` استلام التذكرة.
- `/ticket-close` إغلاق التذكرة مع سبب.
- `/ticket-add` إضافة عضو للتذكرة.
- `/ticket-remove` إزالة عضو من التذكرة.
- `/ticket-rename` تغيير اسم التذكرة.

كل عضو يستطيع فتح تذكرة واحدة من كل نوع، والتذاكر كلها تفتح داخل كاتجوري `1520477634822144060` مع لوق مرتب.

## أوامر الإدارة والنقاط

- `/timeout` و `/untimeout` لرتبة `Timeout Manager`.
- `/kick` لرتبة `Kick Manager`.
- `/ban` و `/unban` لرتبة `Ban Manager`.
- `/clear` و `/lock` و `/unlock` لرتبة `Chat Manager`.
- `/warn` و `/unwarn` و `/warnings` لرتبة `Warning Manager`.
- `/addrole` و `/removerole` لرتبة `Role Manager`.
- `/points` لعرض النقاط.
- `/leaderboard` لعرض أفضل الإداريين.

كل أمر إداري ناجح يعطي المسؤول **0.5 نقطة**.

## مزايا تلقائية

- ترحيب تلقائي بإيمبد جميل يحتوي اسم السيرفر وصورة الترحيب.
- الاقتراحات: يحذف رسالة العضو ويعيد نشرها بإيمبد مع ✅ و ❌.
- الضريبة: يحسب الضريبة تلقائيًا عند إرسال رقم في روم الضريبة.
- التقييم: يحذف رسالة العضو ويعيد نشر التقييم بشكل مرتب مع اسم المقيم.
- `/summon` لاستدعاء مبرمج أو رسام/مصمم أو مصمم سيرفرات.
- `/help` يعرض لوحة أوامر منظمة داخل السيرفر.

## ملاحظات الصلاحيات

فعّل هذه الخيارات من Discord Developer Portal:

- Server Members Intent
- Message Content Intent

ويجب إعطاء البوت صلاحيات إدارة الرومات، الرسائل، الرتب، الحظر، الطرد، والتايم اوت حسب الأوامر المطلوبة.
