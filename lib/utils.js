'use strict';

const ForceArray = require('force-array');
const Hasha = require('hasha');


exports.toNameValues = (obj) => {
  if (!obj) {
    return [];
  }

  return Object.keys(obj).map((name) => {
    const value = obj[name];
    return {
      id: Hasha(JSON.stringify({ name, value })),
      name,
      value
    };
  });
};

exports.fromNameValues = (nameValues, prefix = '') => {
  return ForceArray(nameValues).reduce((accumulator, { name, value }) => {
    return Object.assign(accumulator, {
      [prefix + name]: name === 'triton.cns.disable' ? JSON.parse(value) : value
    });
  }, {});
};

exports.toPage = ({ res = {}, payload, offset, limit }) => {
  const headers = res.headers || {};
  return {
    offset: offset || 0,
    limit: limit || 0,
    total: parseInt(headers['x-resource-count'], 10) || 0,
    results: payload
  };
};
