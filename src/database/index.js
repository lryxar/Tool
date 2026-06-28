'use strict';

const fs = require('fs');
const path = require('path');
const { DatabaseSync } = require('node:sqlite');

function normalizeFile(config) {
  const configured = config.file || 'src/storage/velora.sqlite';
  return path.isAbsolute(configured) ? configured : path.resolve(__dirname, '../..', configured);
}

async function createDatabase(config = {}) {
  if (config.driver && config.driver !== 'sqlite') {
    throw new Error(`Unsupported database driver "${config.driver}". VELORA HUB V1 uses SQLite on Node.js 24.`);
  }

  const file = normalizeFile(config);
  fs.mkdirSync(path.dirname(file), { recursive: true });
  const db = new DatabaseSync(file);
  db.exec('PRAGMA journal_mode = WAL');
  db.exec('PRAGMA foreign_keys = ON');
  db.exec(`CREATE TABLE IF NOT EXISTS key_value (namespace TEXT NOT NULL, key TEXT NOT NULL, value TEXT NOT NULL, updated_at INTEGER NOT NULL, PRIMARY KEY(namespace, key))`);
  db.exec(`CREATE TABLE IF NOT EXISTS tickets (id INTEGER PRIMARY KEY AUTOINCREMENT, guild_id TEXT NOT NULL, channel_id TEXT NOT NULL UNIQUE, owner_id TEXT NOT NULL, type TEXT NOT NULL, status TEXT NOT NULL DEFAULT 'open', claimed_by TEXT, created_at INTEGER NOT NULL, closed_at INTEGER)`);
  db.exec(`CREATE TABLE IF NOT EXISTS logs (id INTEGER PRIMARY KEY AUTOINCREMENT, guild_id TEXT, type TEXT NOT NULL, actor_id TEXT, target_id TEXT, payload TEXT, created_at INTEGER NOT NULL)`);

  return {
    db,
    run(sql, params = []) { return db.prepare(sql).run(...params); },
    get(sql, params = []) { return db.prepare(sql).get(...params); },
    all(sql, params = []) { return db.prepare(sql).all(...params); },
    close() { db.close(); }
  };
}

module.exports = { createDatabase };
