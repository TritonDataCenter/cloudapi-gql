'use strict';

const Path = require('path');
const { expect } = require('code');
const Hapi = require('hapi');
const Lab = require('lab');
const StandIn = require('stand-in');
const CloudApiGql = require('../lib/');
const CloudApi = require('../lib/cloudapi');


const lab = exports.lab = Lab.script();
const { describe, it } = lab;


describe('datacenters', () => {
  it('can get all datacenters', async () => {
    const datacenters = {
      'us-west-1': 'http://test.com'
    };

    const server = new Hapi.Server();
    StandIn.replaceOnce(CloudApi.prototype, 'fetch', () => {
      return datacenters;
    });

    await server.register({ plugin: CloudApiGql, options: { keyPath: Path.join(__dirname, 'test.key') } });
    await server.initialize();
    const res = await server.inject({
      url: '/graphql',
      method: 'post',
      payload: { query: 'query { datacenters { name, place, url } }' }
    });
    expect(res.statusCode).to.equal(200);
    expect(res.result.data.datacenters).to.exist();
    expect(res.result.data.datacenters[0].place).to.equal('Americas');
    expect(res.result.data.datacenters[0].name).to.equal('us-west-1');
    expect(res.result.data.datacenters[0].url).to.equal('http://test.com');
  });
});
