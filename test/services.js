'use strict';

const Path = require('path');
const { expect } = require('code');
const Lab = require('lab');
const Hapi = require('hapi');
const StandIn = require('stand-in');
const CloudApiGql = require('../lib/');
const CloudApi = require('webconsole-cloudapi-client');
const QueryString = require('querystring');
const Graphi = require('graphi');


const lab = exports.lab = Lab.script();
const { it, describe, afterEach } = lab;

const serviceList = {
  cloudapi: 'https://us-west-1.api.example.com',
  docker: 'tcp://us-west-1.docker.example.com',
  manta: 'https://us-west.manta.example.com'
};

describe('services', () => {
  afterEach(() => {
    StandIn.restoreAll();
  });

  const register = [
    {
      plugin: Graphi
    },
    {
      plugin: CloudApiGql,
      options: {
        keyPath: Path.join(__dirname, 'test.key'),
        keyId: 'test',
        apiBaseUrl: 'http://localhost'
      }
    }
  ];

  it('returns a list of available services', async () => {
    const server = new Hapi.Server();
    StandIn.replaceOnce(CloudApi.prototype, 'fetch', (stand) => {
      return serviceList;
    });

    const query = QueryString.stringify({ query: 'query { services { id name value } }' });
    await server.register(register);
    await server.initialize();
    const res = await server.inject({
      url: `/graphql?${query}`
    });

    expect(res.statusCode).to.equal(200);
    expect(res.result.data.services).to.exist();
    expect(res.result.data.services[0].name).to.equal('cloudapi');
    expect(res.result.data.services[0].value).to.equal('https://us-west-1.api.example.com');
  });
});
