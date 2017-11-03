'use strict';

const CloudApi = require('./cloudapi');


exports.get = (args, request) => {
  return CloudApi('getAccount', args, request);
};

exports.update = (args, request) => {
  return CloudApi('updateAccount', args, request);
};
