'use strict';

const { expect } = require('code');
const Lab = require('lab');
const StandIn = require('stand-in');
const CloudApi = require('webconsole-cloudapi-client');
const QueryString = require('querystring');
const ServerHelper = require('./helpers');


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

  it('returns a list of available services', async () => {
    const server = await ServerHelper.getServer();
    StandIn.replaceOnce(CloudApi.prototype, 'fetch', (stand) => {
      return serviceList;
    });

    const query = QueryString.stringify({ query: 'query { services { id name value } }' });
    const res = await server.inject({
      url: `/graphql?${query}`
    });

    expect(res.statusCode).to.equal(200);
    expect(res.result.data.services).to.exist();
    expect(res.result.data.services[0].name).to.equal('cloudapi');
    expect(res.result.data.services[0].value).to.equal('https://us-west-1.api.example.com');
  });
});
