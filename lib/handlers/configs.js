'use strict';

const Utils = require('../utils');


exports.config = async (fetch) => {
  const config = await fetch('/config');
  return Utils.toNameValues(config);
};

exports.updateConfig = async (fetch, { default_network }) => {
  const config = await fetch('/config', { method: 'put', payload: { default_network } });
  return Utils.toNameValues(config);
};
