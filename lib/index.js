'use strict';

const Assert = require('assert');
const Fs = require('fs');
const Path = require('path');
const Graphi = require('graphi');
const { makeExecutableSchema } = require('./utils');
const Package = require('../package.json');
const CloudApi = require('./cloudapi');
const Formatters = require('./formatters');
const Routes = require('./routes');

const Schema = Fs.readFileSync(Path.join(__dirname, '/schema.graphql'));

const setupCloudApi = ({ keyId, key, apiBaseUrl }) => {
  return (request, h) => {
    if (request.route.settings.auth === false) {
      return h.continue;
    }

    request.plugins.cloudapi = new CloudApi({
      token: request.auth && request.auth.credentials && request.auth.credentials.token,
      url: apiBaseUrl,
      keyId,
      key,
      log: request.log.bind(request)
    });

    return h.continue;
  };
};

const graphqlHandler = function (route, options) {
  Assert(typeof options.method === 'function', 'method must be a function');

  return function (request, h) {
    const fetch = request.plugins.cloudapi.fetch.bind(request.plugins.cloudapi);
    return options.method(fetch, request.payload);
  };
};

const register = async (server, options) => {
  const schema = makeExecutableSchema({
    typeDefs: Schema.toString(),
    resolvers: Formatters
  });

  server.decorate('handler', 'graphql', graphqlHandler);
  server.route(Routes);

  const graphiOptions = {
    graphiqlPath: process.env.NODE_ENV === 'development' ? '/graphiql' : options.graphiqlPath,
    schema: schema,
    authStrategy: options.authStrategy
  };

  await server.register({ plugin: Graphi, options: graphiOptions });

  const apiBaseUrl = options.apiBaseUrl || process.env.SDC_URL;
  const keyId = options.keyId || process.env.SDC_KEY_ID;
  const keyPath = options.keyPath || process.env.SDC_KEY_PATH;

  const key = Fs.readFileSync(keyPath);

  server.ext('onPostAuth', setupCloudApi({ keyId, key, apiBaseUrl }));
};

module.exports = {
  pkg: Package,
  register
};
