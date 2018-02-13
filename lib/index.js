'use strict';

const Fs = require('fs');
const Path = require('path');
const Graphi = require('graphi');
const { makeExecutableSchema } = require('graphql-tools');
const Package = require('../package.json');
const { CloudApi } = require('./cloudapi');
const Resolvers = require('./resolvers');
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
      key
    });

    return h.continue;
  };
};

const register = async (server, options) => {
  const schema = makeExecutableSchema({
    typeDefs: Schema.toString(),
    resolvers: Resolvers
  });

  server.route(Routes);

  const graphiOptions = {
    graphiqlPath: process.env.NODE_ENV === 'development' ? '/graphiql' : options.graphiqlPath,
    schema: schema,
    resolvers: Resolvers,
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
