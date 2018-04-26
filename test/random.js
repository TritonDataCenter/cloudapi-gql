'use strict';

const { expect } = require('code');
const Lab = require('lab');
const StandIn = require('stand-in');
const CloudApi = require('webconsole-cloudapi-client');
const ServerHelper = require('./helpers/server');


const lab = exports.lab = Lab.script();
const { describe, it, afterEach } = lab;


describe('random', () => {
  afterEach(() => {
    StandIn.restoreAll();
  });

  it('can query for a random machine name', async () => {
    const server = await ServerHelper.getServer();
    StandIn.replaceOnce(CloudApi.prototype, 'fetch', (stand) => {
      return [];
    });

    const res = await server.inject({
      url: '/graphql',
      method: 'post',
      payload: { query: 'query { rndName }' }
    });
    expect(res.statusCode).to.equal(200);
    expect(res.result.data.rndName).to.exist();
  });

  it('can query for a random image', async () => {
    const server = await ServerHelper.getServer();
    StandIn.replaceOnce(CloudApi.prototype, 'fetch', (stand) => {
      return [];
    });

    const res = await server.inject({
      url: '/graphql',
      method: 'post',
      payload: { query: 'query { rndImageName }' }
    });
    expect(res.statusCode).to.equal(200);
    expect(res.result.data.rndImageName).to.exist();
  });
});
