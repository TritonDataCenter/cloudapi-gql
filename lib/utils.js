'use strict';

const Assert = require('assert');
const ForceArray = require('force-array');
const { graphql } = require('graphi');
const Hasha = require('hasha');


exports.toNameValues = (obj) => {
  if (!obj) {
    return [];
  }

  return Object.keys(obj).map((name) => {
    const value = obj[name];
    return {
      id: Hasha(JSON.stringify({ name, value })),
      name,
      value
    };
  });
};

exports.fromNameValues = (nameValues, prefix = '') => {
  return ForceArray(nameValues).reduce((accumulator, { name, value }) => {
    return Object.assign(accumulator, {
      [prefix + name]: name === 'triton.cns.disable' ? JSON.parse(value) : value
    });
  }, {});
};

exports.toPage = ({ res = {}, payload, offset, limit }) => {
  const headers = res.headers || {};
  return {
    offset: offset || 0,
    limit: limit || 0,
    total: parseInt(headers['x-resource-count'], 10) || 0,
    results: payload
  };
};


// Inspired by graphql-tools
exports.makeExecutableSchema = ({ typeDefs, resolvers = {} }) => {
  const parsed = graphql.parse(typeDefs);
  const astSchema = graphql.buildASTSchema(parsed, { commentDescriptions: true });

  for (const resolverName of Object.keys(resolvers)) {
    const type = astSchema.getType(resolverName);
    Assert(type || resolverName === '__schema', `Missing schema definition for resolver: ${resolverName}`);

    const typeResolver = resolvers[resolverName];

    // go through field resolvers for the parent resolver type
    for (const fieldName of Object.keys(typeResolver)) {
      const fieldResolver = typeResolver[fieldName];
      Assert(typeof fieldResolver === 'function', `${resolverName}.${fieldName} resolver must be a function`);

      if (type instanceof graphql.GraphQLScalarType) {
        type[fieldName] = field;
        continue;
      }

      if (type instanceof graphql.GraphQLEnumType) {
        const fieldType = type.getValue(fieldName);
        Assert(fieldType, `${resolverName}.${fieldName} enum definition missing from schema`);
        fieldType.value = field;
        continue;
      }

      // no need to set resolvers unless we are dealing with a type that needs resolvers
      if (!(type instanceof graphql.GraphQLObjectType) && !(type instanceof graphql.GraphQLInterfaceType)) {
        continue;
      }

      const fields = type.getFields();
      if (!fields) {
        continue;
      }

      fields[fieldName].resolve = fieldResolver;
    }
  }
  return astSchema;
};
