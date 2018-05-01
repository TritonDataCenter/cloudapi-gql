'use strict';

const QueryString = require('querystring');
const { expect } = require('code');
const Lab = require('lab');
const StandIn = require('stand-in');
const CloudApi = require('webconsole-cloudapi-client');
const ServerHelper = require('./helpers');

const lab = exports.lab = Lab.script();
const { describe, it, afterEach } = lab;


describe('config', () => {
  afterEach(() => {
    StandIn.restoreAll();
  });

  it('can get all configs', async () => {
    const config = {
      default_network: '45607081-4cd2-45c8-baf7-79da760fffaa'
    };

    StandIn.replaceOnce(CloudApi.prototype, 'fetch', (stand) => {
      return config;
    });

    const query = QueryString.stringify({ query: 'query { config { name value } }' });
    const server = await ServerHelper.getServer();
    const res = await server.inject({
      url: `/graphql?${query}`
    });

    expect(res.statusCode).to.equal(200);
    expect(res.result.data.config).to.exist();
    expect(res.result.data.config[0].name).to.equal('default_network');
    expect(res.result.data.config[0].value).to.equal('45607081-4cd2-45c8-baf7-79da760fffaa');
  });

  it('can update a config', async () => {
    const config = {
      default_network: '45607081-4cd2-45c8-baf7-79da760fffaa'
    };

    StandIn.replaceOnce(CloudApi.prototype, 'fetch', (stand) => {
      return config;
    });

    const server = await ServerHelper.getServer();
    const res = await server.inject({
      url: '/graphql',
      method: 'post',
      payload: {
        query: `mutation {
        updateConfig(
          default_network: "45607081-4cd2-45c8-baf7-79da760fffaa"
        ) { id name value } }`
      }
    });

    expect(res.statusCode).to.equal(200);
    expect(res.result.data.updateConfig).to.exist();
    expect(res.result.data.updateConfig[0].name).to.equal('default_network');
    expect(res.result.data.updateConfig[0].value).to.equal('45607081-4cd2-45c8-baf7-79da760fffaa');
  });
});
