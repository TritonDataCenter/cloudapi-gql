'use strict';

const Fs = require('fs');
const Path = require('path');
const Graphi = require('graphi');
const { makeExecutableSchema } = require('graphql-tools');
const Package = require('../package.json');
const Resolvers = require('./resolvers');
const Schema = Fs.readFileSync(Path.join(__dirname, '/schema.graphql'));


module.exports = function (server, options, next) {
  const schema = makeExecutableSchema({ typeDefs: Schema.toString(), resolvers: Resolvers });
  const graphiOptions = {
    graphiqlPath: (process.env.NODE_ENV === 'development') ? '/graphiql' : false,
    schema
  };

  server.register({ register: Graphi, options: graphiOptions }, next);
};

module.exports.attributes = {
  pkg: Package
};
