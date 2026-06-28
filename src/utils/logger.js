'use strict';

function createLogger(scope) {
  const fmt = level => (...args) => console[level](`[${new Date().toISOString()}] [${scope}]`, ...args);
  return { info: fmt('log'), warn: fmt('warn'), error: fmt('error') };
}
module.exports = { createLogger };
