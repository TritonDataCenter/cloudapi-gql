'use strict';

const CloudApi = require('./cloudapi');


module.exports = (args, request) => {
  const options = {
    path: '/my/config'
  };
  return CloudApi('fetch', options, request);
};
