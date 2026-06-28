'use strict';

const { spawnSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const required = [
  'config.json', 'owners.json', 'permissions.json', 'panels.json', 'tickets.json', 'logs.json',
  'welcome.json', 'tax.json', 'reviews.json', 'suggestions.json', 'themes.json', 'backup.json',
  'database.json', 'security.json'
];

for (const file of required) {
  const full = path.join(root, file);
  if (!fs.existsSync(full)) throw new Error(`Missing required config file: ${file}`);
  JSON.parse(fs.readFileSync(full, 'utf8'));
}

function walk(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap(entry => {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) return entry.name === 'node_modules' ? [] : walk(full);
    return entry.isFile() && entry.name.endsWith('.js') ? [full] : [];
  });
}

for (const file of walk(root)) {
  const result = spawnSync(process.execPath, ['--check', file], { encoding: 'utf8' });
  if (result.status !== 0) {
    process.stderr.write(result.stderr || result.stdout);
    process.exit(result.status || 1);
  }
}

console.log('Project validation passed.');
