'use strict';

const Handlers = require('./handlers');

module.exports = [
  {
    method: 'graphql',
    path: '/rndName',
    handler: Handlers.rndName
  },
  {
    method: 'graphql',
    path: '/rndImageName',
    handler: Handlers.rndImageName
  }
];
