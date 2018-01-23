'use strict';

// Requires .env.js file with the following exports:
// SDC_URL, SDC_KEY_ID, SDC_KEY_PATH
require('./env.js');

const { renderVoyagerPage } = require('graphql-voyager/middleware');
const { renderPlaygroundPage } = require('graphql-playground-html');
const Hapi = require('hapi');
const Inert = require('inert');
const Sso = require('minio-proto-auth');
const CloudApiGql = require('./');

const {
  COOKIE_PASSWORD,
  COOKIE_DOMAIN,
  SDC_KEY_PATH,
  SDC_ACCOUNT,
  SDC_KEY_ID,
  SDC_URL,
  BASE_URL = 'http://0.0.0.0:4000',
  NODE_ENV
} = process.env;

const start = async () => {
  const server = Hapi.server({
    port: 4000,
    routes: {
      cors: {
        origin: ['*'],
        credentials: true,
        additionalHeaders: ['Cookie']
      }
    },
    debug: {
      log: ['error'],
      request: ['error']
    }
  });

  server.events.on('log', (event, tags) => {
    if (tags.error) {
      console.log(event);
    }
  });

  server.events.on('request', (request, event) => {
    const { tags } = event;
    if (tags.includes('error') && event.data && event.data.errors) {
      event.data.errors.forEach((error) => {
        console.log(error);
      });
    }
  });

  await server.register(
    [
      Inert,
      {
        plugin: Sso,
        options: {
          cookie: {
            password: COOKIE_PASSWORD,
            domain: COOKIE_DOMAIN,
            isSecure: false,
            isHttpOnly: true,
            ttl: 1000 * 60 * 60       // 1 hour
          },
          sso: {
            keyPath: SDC_KEY_PATH,
            keyId: '/' + SDC_ACCOUNT + '/keys/' + SDC_KEY_ID,
            apiBaseUrl: SDC_URL,
            url: 'https://sso.joyent.com/login',
            permissions: { 'cloudapi': ['/my/*'] },
            baseUrl: BASE_URL,
            isDev: NODE_ENV === 'development'
          }
        }
      },
      {
        plugin: CloudApiGql,
        options: {
          authStrategy: 'sso'
        }
      }
    ]);

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
    },
    {
      method: 'GET',
      path: '/voyager',
      handler: (request, h) => {
        const rendered = renderVoyagerPage({ path: '/voyager', endpointUrl: '/graphql'});
        return h.response(rendered).type('text/html');
      }
    },
    {
      method: 'GET',
      path: '/playground',
      handler: async (request, h) => {
        const rendered = await renderPlaygroundPage({
          path: '/playground',
          endpoint: '/graphql',
          version: '1.3.20',
          env: 'development',
          htmlTitle: 'CloudAPI GQL'
        });

        return h.response(rendered).type('text/html');
      }
    }
  ]);

  server.auth.default('sso');

  await server.start();
  // eslint-disable-next-line no-console
  console.log(`server started at http://0.0.0.0:${server.info.port}`);
};

start();
