'use strict';

const Utils = require('../utils');


exports.services = async (fetch) => {
  const services = await fetch('/services');
  return Utils.toNameValues(services);
};
