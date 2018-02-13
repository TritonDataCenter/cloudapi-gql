'use strict';

const Handlers = require('./handlers');


const routes = module.exports = [];

const handlerKeys = Object.keys(Handlers);
for (const key of handlerKeys) {
  routes.push({
    method: 'graphql',
    path: `/${key}`,
    handler: Handlers[key]
  });
}
