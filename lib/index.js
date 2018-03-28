'use strict';

const Assert = require('assert');
const Fs = require('fs');
const Url = require('url');
const Path = require('path');
const Graphi = require('graphi');
const Package = require('../package.json');
const CloudApi = require('cloudapi-client');
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
    return options.method(fetch, request.payload, request);
  };
};

const register = async (server, options = {}) => {
  Assert(options.apiBaseUrl, 'options.apiBaseUrl is required');
  Assert(options.keyId, 'options.keyId is required');
  Assert(options.keyPath, 'options.keyPath is required');

  options.dcName = options.dcName || Url.parse(options.apiBaseUrl).host.split('.')[0];

  const schema = Graphi.makeExecutableSchema({
    schema: Schema.toString(),
    resolvers: Formatters
  });

  server.decorate('handler', 'graphql', graphqlHandler);
  server.expose('options', options);
  server.route(Routes);

  const graphiOptions = {
    graphiqlPath: process.env.NODE_ENV === 'development' ? '/graphiql' : options.graphiqlPath,
    schema: schema,
    authStrategy: options.authStrategy
  };

  await server.register({ plugin: Graphi, options: graphiOptions });

  const key = Fs.readFileSync(options.keyPath);
  server.ext('onPostAuth', setupCloudApi({ key, ...options }));
};

module.exports = {
  pkg: Package,
  register
};
