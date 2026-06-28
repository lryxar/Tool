'use strict';

const { start } = require('./app');

start().catch(error => {
  console.error('[VELORA HUB] Fatal startup error:', error);
  process.exitCode = 1;
});
