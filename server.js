'use strict';

const http = require('http');
const fs = require('fs');
const path = require('path');
const { generateBatch, toGiftURL } = require('./src/generator');
const { checkCode, checkBatch, summarise } = require('./src/checker');
const { sendWebhook } = require('./src/webhook');

let cfg = { port: 3000, concurrencyLimit: 5, delayLimit: 5000 };
try { cfg = { ...cfg, ...require('./config.json') }; } catch (_) { }

const PORT = cfg.port;
const PUBLIC = path.join(__dirname, 'public');

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css',
  '.js': 'application/javascript',
  '.json': 'application/json',
  '.ico': 'image/x-icon',
};

function readBody(req) {
  return new Promise((res, rej) => {
    let d = '';
    req.on('data', c => d += c);
    req.on('end', () => { try { res(JSON.parse(d || '{}')); } catch (e) { rej(e); } });
    req.on('error', rej);
  });
}

function json(res, status, body) {
  const p = JSON.stringify(body);
  res.writeHead(status, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' });
  res.end(p);
}

function sse(res, event, data) {
  res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
}

async function router(req, res) {
  const url = new URL(req.url, `http://localhost:${PORT}`);
  const method = req.method.toUpperCase();

  if (method === 'OPTIONS') {
    res.writeHead(204, { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Methods': 'GET,POST', 'Access-Control-Allow-Headers': 'Content-Type' });
    return res.end();
  }

  if (method === 'GET' && !url.pathname.startsWith('/api/')) {
    const fp = url.pathname === '/' ? path.join(PUBLIC, 'index.html') : path.join(PUBLIC, url.pathname);
    if (!fp.startsWith(PUBLIC)) { res.writeHead(403); return res.end('Forbidden'); }
    fs.readFile(fp, (err, data) => {
      if (err) { res.writeHead(404); return res.end('Not found'); }
      res.writeHead(200, { 'Content-Type': MIME[path.extname(fp)] || 'text/plain' });
      res.end(data);
    });
    return;
  }

  if (method === 'POST' && url.pathname === '/api/generate') {
    try {
      const b = await readBody(req);
      const count = Math.min(Math.max(parseInt(b.count) || 20, 1), 200);
      const length = [16, 24].includes(parseInt(b.length)) ? parseInt(b.length) : 16;
      const codes = generateBatch(count, length);
      return json(res, 200, { ok: true, count: codes.length, codes: codes.map(c => ({ code: c, url: toGiftURL(c) })) });
    } catch (e) { return json(res, 400, { ok: false, error: e.message }); }
  }

  if (method === 'POST' && url.pathname === '/api/check') {
    try {
      const b = await readBody(req);
      const code = String(b.code || '').trim();
      const token = b.token || null;
      const result = await checkCode(code, token);
      return json(res, 200, { ok: true, result });
    } catch (e) { return json(res, 400, { ok: false, error: e.message }); }
  }

  if (method === 'GET' && url.pathname === '/api/scan') {
    const count = Math.min(parseInt(url.searchParams.get('count')) || 10, 100);
    const conc = Math.min(parseInt(url.searchParams.get('conc')) || 2, cfg.concurrencyLimit);
    const delay = Math.min(parseInt(url.searchParams.get('delay')) || 500, cfg.delayLimit);
    const token = url.searchParams.get('token') || null;
    const webhook = url.searchParams.get('webhook') || null;

    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'Access-Control-Allow-Origin': '*',
      'X-Accel-Buffering': 'no',
    });
    res.write(': ping\n\n');

    const codes = generateBatch(count);
    sse(res, 'start', { total: codes.length, codes: codes.map(c => toGiftURL(c)) });

    let checkedN = 0, validN = 0, invalidN = 0;

    await checkBatch(codes, {
      concurrency: conc, delayMs: delay, token,
      onResult: async (r) => {
        checkedN++;
        if (r.status === 'valid') validN++;
        if (r.status === 'invalid') invalidN++;
        sse(res, 'result', { ...r, url: toGiftURL(r.code), checked: checkedN, total: codes.length, valid: validN, invalid: invalidN });
        if (r.status === 'valid' && webhook) {
          const wStatus = await sendWebhook(webhook, r);
          sse(res, 'webhook', { code: r.code, httpStatus: wStatus, ok: wStatus === 204 });
        }
      },
    });

    sse(res, 'done', { total: codes.length, valid: validN, invalid: invalidN, errors: codes.length - validN - invalidN });
    res.end();
    return;
  }

  json(res, 404, { ok: false, error: 'Not found' });
}

const server = http.createServer(router);

server.listen(PORT, () => {
  const line = '═'.repeat(42);
  console.log(`\n  ╔${line}╗`);
  console.log(`  ║${'       EnzoTool — Nitro Tool Server'.padEnd(42)}║`);
  console.log(`  ╚${line}╝\n`);
  console.log(`  \x1b[96mhttp://localhost:${PORT}\x1b[0m`);
  console.log(`  \x1b[90mPress Ctrl + C to stop.\x1b[0m\n`);
});

server.on('error', err => { console.error('\x1b[91mServer error:\x1b[0m', err.message); process.exit(1); });
