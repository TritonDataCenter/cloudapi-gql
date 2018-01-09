'use strict';

const Fs = require('fs');
const Boom = require('boom');
const Reach = require('reach');
const Path = require('path');
const Graphi = require('graphi');
const { makeExecutableSchema } = require('graphql-tools');
const Package = require('../package.json');
const { CloudApi } = require('./cloudapi');
const Resolvers = require('./resolvers');

const { NODE_ENV, SDC_URL } = process.env;

const Schema = Fs.readFileSync(Path.join(__dirname, '/schema.graphql'));

const setupCloudApi = async (request, h) => {
  if (request.route.settings.auth === false) {
    return h.continue;
  }

  request.plugins.cloudapi = new CloudApi({
    token: Reach(request.auth, 'credentials.token'),
    url: request.server.app.cloudapiUrl
  });

  return h.continue;
};

const register = async (server, { authStrategy, cloudapiUrl }) => {
  const schema = makeExecutableSchema({
    typeDefs: Schema.toString(),
    resolvers: Resolvers
  });

  const graphiOptions = {
    graphiqlPath: NODE_ENV === 'development' ? '/graphiql' : false,
    schema,
    resolvers: Resolvers,
    authStrategy
  };

  server.app.cloudapiUrl = cloudapiUrl || SDC_URL;

  await server.register({ plugin: Graphi, options: graphiOptions });

  server.ext('onPostAuth', setupCloudApi);
};

module.exports = {
  pkg: Package,
  register
};
