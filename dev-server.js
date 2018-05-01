'use strict';

const Url = require('url');
const { renderVoyagerPage } = require('graphql-voyager/middleware');
const { renderPlaygroundPage } = require('graphql-playground-html');
const Graphi = require('graphi');
const Hapi = require('hapi');
const Inert = require('inert');
const Sso = require('hapi-triton-auth');
const CloudApiGql = require('./');

const {
  SDC_KEY_PATH,
  SDC_ACCOUNT,
  SDC_KEY_ID,
  SDC_URL,
  BASE_URL = 'http://0.0.0.0:8081',
  DC_NAME,
  PORT = 8081
} = process.env;

const start = async () => {
  const dcName = DC_NAME || Url.parse(SDC_URL).host.split('.')[0];
  const server = Hapi.server({
    port: PORT,
    routes: {
      cors: {
        origin: ['*'],
        credentials: true,
        additionalHeaders: ['Cookie', 'X-CSRF-Token']
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
          keyPath: SDC_KEY_PATH,
          keyId: '/' + SDC_ACCOUNT + '/keys/' + SDC_KEY_ID,
          apiBaseUrl: SDC_URL,
          ssoUrl: 'https://sso.joyent.com/login',
          permissions: { 'cloudapi': ['/my/*'] },
          baseUrl: BASE_URL,
          isDev: true,
          cookie: {
            ttl: 1000 * 60 * 60       // 1 hour
          }
        }
      },
      {
        plugin: Graphi,
        options: {
          graphqlPath: '/graphql',
          graphiqlPath: '/graphiql',
          authStrategy: 'sso'
        }
      },
      {
        plugin: CloudApiGql,
        options: {
          keyPath: SDC_KEY_PATH,
          keyId: '/' + SDC_ACCOUNT + '/keys/' + SDC_KEY_ID,
          apiBaseUrl: SDC_URL,
          dcName
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

process.on('unhandledRejection', (err) => {
  console.error(err);
});

start();
