'use strict';

// Requires .env.js file with the following exports:
// SDC_URL, SDC_KEY_ID, SDC_KEY_PATH

const { hapi: Voyager } = require('graphql-voyager/middleware');
const { hapi: Playground } = require('graphql-playground/middleware');
const Hapi = require('hapi');
const Inert = require('inert');
const CloudApiGql = require('./');


const server = new Hapi.Server({
  debug: {
    log: ['error'],
    request: ['error']
  }
});

const handlerError = (err) => {
  if (err) {
    // eslint-disable-next-line no-console
    console.error(err);
    process.exit(1);
  }
};

server.connection({
  port: 4000,
  routes: {
    cors: {
      origin: ['*'],
      credentials: true,
      additionalHeaders: ['Cookie']
    }
  }
});

server.register(
  [
    Inert,
    CloudApiGql,
    {
      register: Playground,
      options: {
        path: '/playground',
        endpointUrl: '/graphql'
      }
    },
    {
      register: Voyager,
      options: {
        path: '/voyager',
        endpointUrl: '/graphql'
      }
    }
  ],
  (err) => {
    handlerError(err);

    server.route([
      {
        method: 'GET',
        path: '/doc/{param*}',
        config: {
          handler: {
            directory: {
              path: './doc',
              redirectToSlash: true,
              index: true
            }
          }
        }
      }
    ]);

    server.start((err) => {
      handlerError(err);
      // eslint-disable-next-line no-console
      console.log(`server started at http://0.0.0.0:${server.info.port}`);
    });
  }
);
