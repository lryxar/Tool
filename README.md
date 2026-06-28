# 🚀 VELORA HUB

**VELORA HUB** is a complete modular rewrite roadmap and V1 foundation for a Discord bot built with **JavaScript (Node.js)**, **discord.js v14**, and **SQLite**.

## V1.0.0 foundation

This repository now follows the requested architecture:

```text
src/
  app.js
  index.js
  config/
  database/
  commands/
    slash/
    prefix/
    developer/
    owner/
  events/
  handlers/
  buttons/
  selectMenus/
  modals/
  autocomplete/
  utils/
  middlewares/
  permissions/
  services/
    tickets/
    logs/
    welcome/
    suggestions/
    reviews/
    tax/
    giveaway/
    voice/
    automod/
    security/
    dashboard/
    backups/
    themes/
  storage/
  locales/
  assets/
    images/
    fonts/
  temp/
```

## Configuration files

The project includes the requested JSON configuration surface:

- `config.json`
- `owners.json`
- `permissions.json`
- `panels.json`
- `tickets.json`
- `logs.json`
- `welcome.json`
- `tax.json`
- `reviews.json`
- `suggestions.json`
- `themes.json`
- `backup.json`
- `database.json`
- `security.json`

Main owners are stored in `owners.json`:

- `1468300473055318087`
- `1195760719774367764`

## Commands and prefixes

- `/` Slash commands
- `!` Admin commands
- `*` Ticket commands
- `$` Developer commands

V1 ships with these slash commands:

- `/help` — shows the VELORA HUB roadmap and module overview.
- `/ping` — checks bot latency.
- `/tickets-panel` — posts the support/purchase ticket panel.

## Services included in V1

- SQLite database bootstrap with tables for key/value storage, tickets, and logs.
- Discord client handler using discord.js v14 intents and partials.
- Slash command loader and command registration script.
- Event loader for `ready`, `interactionCreate`, `guildMemberAdd`, and `messageCreate`.
- Ticket button flow with per-user open-ticket protection.
- Welcome, suggestions, reviews, and tax services.
- Modular folders for future V2–V20 systems.

## Setup

```bash
npm install
export DISCORD_TOKEN="BOT_TOKEN"
export DISCORD_CLIENT_ID="APPLICATION_ID"
export DISCORD_GUILD_ID="GUILD_ID"
npm run register
npm start
```

## Scripts

```bash
npm start       # Start VELORA HUB
npm run register # Register guild slash commands
npm run check   # Syntax-check core files
```

## Roadmap

- **V2:** Administration commands.
- **V3:** Advanced ticket system.
- **V4:** Discord-based customization system.
- **V5:** Ultimate logs.
- **V6:** Protection and AutoMod.
- **V7:** Suggestions.
- **V8:** Reviews.
- **V9:** Tax system.
- **V10:** Giveaway.
- **V11:** Welcome.
- **V12:** Voice system.
- **V13:** Optional economy.
- **V14:** AI system.
- **V15:** Backups.
- **V16:** Themes.
- **V17:** Developer tools.
- **V18:** Performance.
- **V19:** Localization.
- **V20:** Stable production release with documentation, testing, CI/CD, Docker, updates, plugin system, API, and optional dashboard.
