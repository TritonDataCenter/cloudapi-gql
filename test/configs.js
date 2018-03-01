'use strict';

const Path = require('path');
const QueryString = require('querystring');
const { expect } = require('code');
const Hapi = require('hapi');
const Lab = require('lab');
const StandIn = require('stand-in');
const CloudApiGql = require('../lib/');
const CloudApi = require('../lib/cloudapi');


const lab = exports.lab = Lab.script();
const { describe, it, afterEach } = lab;


describe('config', () => {
  afterEach(() => {
    StandIn.restoreAll();
  });

  const register = {
    plugin: CloudApiGql,
    options: {
      keyPath: Path.join(__dirname, 'test.key'),
      keyId: 'test',
      apiBaseUrl: 'http://localhost'
    }
  };

  it('can get all configs', async () => {
    const config = {
      default_network: '45607081-4cd2-45c8-baf7-79da760fffaa'
    };

    const server = new Hapi.Server();
    StandIn.replaceOnce(CloudApi.prototype, 'fetch', (stand) => {
      return config;
    });

    const query = QueryString.stringify({ query: 'query { config { name value } }' });
    await server.register(register);
    await server.initialize();
    const res = await server.inject({
      url: `/graphql?${query}`
    });

    expect(res.statusCode).to.equal(200);
    expect(res.result.data.config).to.exist();
    expect(res.result.data.config[0].name).to.equal('default_network');
    expect(res.result.data.config[0].value).to.equal('45607081-4cd2-45c8-baf7-79da760fffaa');
  });
});
