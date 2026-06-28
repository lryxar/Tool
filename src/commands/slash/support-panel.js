'use strict';
const createPanel = require('./tickets-panel');
module.exports = context => {
  const command = createPanel(context);
  command.data.setName('support-panel').setDescription('إرسال لوحة الدعم الفني فقط');
  command.panelTypes = ['support'];
  return command;
};
