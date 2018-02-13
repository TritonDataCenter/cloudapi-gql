'use strict';

const Utils = require('../utils');


exports.config = async (fetch) => {
  const config = await fetch('/config');
  return Utils.toNameValues(config);
};
