'use strict';
const Path = require('path');
const Hapi = require('hapi');
const CloudApiGql = require('../../lib/');
const Graphi = require('graphi');


exports.getServer = async (options = {}) => {
  const apiBaseUrl = options.apiBaseUrl || 'http://localhost';
  const dcName = options.dcName;

  const server = new Hapi.Server();
  // const server = new Hapi.Server({ debug: { request: ['error'] } });
  server.auth.scheme('sso', () => {
    return {
      authenticate: (request, h) => {
        return h.authenticated({ credentials: { token: 'foo' } });
      }
    };
  });
  server.auth.strategy('sso', 'sso');

  const register = [
    {
      plugin: Graphi,
      options: {
        authStrategy: 'sso'
      }
    },
    {
      plugin: CloudApiGql,
      options: {
        keyPath: Path.join(__dirname, 'test.key'),
        keyId: 'test',
        apiBaseUrl
      }
    }
  ];

  if (dcName) {
    register[1].options.dcName = dcName;
  }

  await server.register(register);
  await server.initialize();

  return server;
};
