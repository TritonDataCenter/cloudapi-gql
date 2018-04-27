'use strict';

const Assert = require('assert');
const Fs = require('fs');
const Url = require('url');
const Path = require('path');
const Package = require('../package.json');
const Formatters = require('./formatters');
const Routes = require('./routes');
const Setup = require('./setup');

const Schema = Fs.readFileSync(Path.join(__dirname, '/schema.graphql'));

const register = (server, options = {}) => {
  Assert(options.apiBaseUrl, 'options.apiBaseUrl is required');
  Assert(options.keyId, 'options.keyId is required');
  Assert(options.keyPath, 'options.keyPath is required');

  server.dependency('graphi');

  const key = Fs.readFileSync(options.keyPath);
  options.dcName = options.dcName || Url.parse(options.apiBaseUrl).host.split('.')[0];

  const cloudapi = Setup.setupCloudApi({ key, ...options });

  const schema = server.makeExecutableSchema({
    schema: Schema.toString(),
    resolvers: Formatters,
    preResolve: Setup.preResolve(cloudapi)
  });

  server.registerSchema({ schema });

  server.decorate('handler', 'graphql', Setup.graphqlHandler);
  server.expose('options', options);
  server.route(Routes);

  server.ext({ type: 'onPostAuth', method: Setup.postAuth(cloudapi), options: { sandbox: 'plugin' } });
};

module.exports = {
  pkg: Package,
  register
};
