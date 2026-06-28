'use strict';

const fs = require('fs');
const path = require('path');
const sqlite3 = require('sqlite3');

function run(db, sql, params = []) { return new Promise((res, rej) => db.run(sql, params, function cb(err) { err ? rej(err) : res(this); })); }
function get(db, sql, params = []) { return new Promise((res, rej) => db.get(sql, params, (err, row) => err ? rej(err) : res(row))); }
function all(db, sql, params = []) { return new Promise((res, rej) => db.all(sql, params, (err, rows) => err ? rej(err) : res(rows))); }

async function createDatabase(config) {
  const file = path.isAbsolute(config.file) ? config.file : path.resolve(__dirname, '../..', config.file);
  fs.mkdirSync(path.dirname(file), { recursive: true });
  const db = await new Promise((res, rej) => {
    const instance = new sqlite3.Database(file, err => err ? rej(err) : res(instance));
  });
  await run(db, 'PRAGMA journal_mode = WAL');
  await run(db, `CREATE TABLE IF NOT EXISTS key_value (namespace TEXT NOT NULL, key TEXT NOT NULL, value TEXT NOT NULL, updated_at INTEGER NOT NULL, PRIMARY KEY(namespace, key))`);
  await run(db, `CREATE TABLE IF NOT EXISTS tickets (id INTEGER PRIMARY KEY AUTOINCREMENT, guild_id TEXT NOT NULL, channel_id TEXT NOT NULL UNIQUE, owner_id TEXT NOT NULL, type TEXT NOT NULL, status TEXT NOT NULL DEFAULT 'open', claimed_by TEXT, created_at INTEGER NOT NULL, closed_at INTEGER)`);
  await run(db, `CREATE TABLE IF NOT EXISTS logs (id INTEGER PRIMARY KEY AUTOINCREMENT, guild_id TEXT, type TEXT NOT NULL, actor_id TEXT, target_id TEXT, payload TEXT, created_at INTEGER NOT NULL)`);
  return { db, run: (s, p) => run(db, s, p), get: (s, p) => get(db, s, p), all: (s, p) => all(db, s, p) };
}

module.exports = { createDatabase };
