'use strict';
const createPanel = require('./tickets-panel');
module.exports = context => {
  const command = createPanel(context);
  command.data.setName('purchase-panel').setDescription('إرسال لوحة الشراء فقط');
  command.panelTypes = ['purchase'];
  return command;
};
