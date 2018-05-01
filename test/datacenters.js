'use strict';

const { expect } = require('code');
const Lab = require('lab');
const StandIn = require('stand-in');
const CloudApi = require('webconsole-cloudapi-client');
const ServerHelper = require('./helpers');

const lab = exports.lab = Lab.script();
const { describe, it, afterEach } = lab;


describe('datacenters', () => {
  afterEach(() => {
    StandIn.restoreAll();
  });

  it('can get the current datacenter', async () => {
    let fetchPath;
    StandIn.replaceOnce(CloudApi.prototype, 'fetch', (stand, path) => {
      fetchPath = path;
      return {
        res: {
          headers: {
            Location: 'http://us-west-1.joyent.com'
          }
        },
        payload: {
          code: 'ResourceMoved',
          message: 'us-west-1 http://us-west-1.joyent.com'
        }
      };
    });

    const server = await ServerHelper.getServer({apiBaseUrl: 'http://us-west-1.joyent.com'});
    const res = await server.inject({
      url: '/graphql',
      method: 'post',
      payload: { query: 'query { datacenter { name, place, url } }' }
    });
    expect(fetchPath).to.contain('us-west-1');
    expect(res.statusCode).to.equal(200);
    expect(res.result.data.datacenter.place).to.equal('Americas');
    expect(res.result.data.datacenter.name).to.equal('us-west-1');
    expect(res.result.data.datacenter.url).to.equal('http://us-west-1.joyent.com');
  });

  it('can get the current datacenter configured by dcName', async () => {
    let resPath;
    StandIn.replaceOnce(CloudApi.prototype, 'fetch', (stand, path) => {
      resPath = path;
      return {
        res: {
          headers: {
            Location: 'http://us-west-1.joyent.com'
          }
        },
        payload: {
          code: 'ResourceMoved',
          message: 'us-west-1 http://us-west-1.joyent.com'
        }
      };
    });
    const server = await ServerHelper.getServer({ apiBaseUrl: 'http://localhost', dcName: 'us-west-1' });
    const res = await server.inject({
      url: '/graphql',
      method: 'post',
      payload: { query: 'query { datacenter { name, place, url } }' }
    });
    expect(resPath).to.contain('us-west-1');
    expect(res.statusCode).to.equal(200);
    expect(res.result.data.datacenter.place).to.equal('Americas');
    expect(res.result.data.datacenter.name).to.equal('us-west-1');
    expect(res.result.data.datacenter.url).to.equal('http://us-west-1.joyent.com');
  });

  it('can get a single datacenter by name', async () => {
    StandIn.replaceOnce(CloudApi.prototype, 'fetch', () => {
      return {
        res: {
          headers: {
            Location: 'http://us-west-1.joyent.com'
          }
        },
        payload: {
          code: 'ResourceMoved',
          message: 'us-west-1 http://us-west-1.joyent.com'
        }
      };
    });

    const server = await ServerHelper.getServer({ apiBaseUrl: 'http://us-west-1.joyent.com' });
    const res = await server.inject({
      url: '/graphql',
      method: 'post',
      payload: { query: 'query { datacenter(name: "us-west-1") { name, place, url } }' }
    });
    expect(res.statusCode).to.equal(200);
    expect(res.result.data.datacenter.place).to.equal('Americas');
    expect(res.result.data.datacenter.name).to.equal('us-west-1');
    expect(res.result.data.datacenter.url).to.equal('http://us-west-1.joyent.com');
  });

  it('can get a single datacenter by name with unknown location', async () => {
    StandIn.replaceOnce(CloudApi.prototype, 'fetch', () => {
      return {
        res: {
          headers: {
            Location: 'http://af-west-1.joyent.com'
          }
        },
        payload: {
          code: 'ResourceMoved',
          message: 'af-west-1 http://af-west-1.joyent.com'
        }
      };
    });

    const server = await ServerHelper.getServer({ apiBaseUrl: 'http://us-west-1.joyent.com' });
    const res = await server.inject({
      url: '/graphql',
      method: 'post',
      payload: { query: 'query { datacenter(name: "af-west-1") { name, place, url } }' }
    });
    expect(res.statusCode).to.equal(200);
    expect(res.result.data.datacenter.place).to.equal('Unknown');
    expect(res.result.data.datacenter.name).to.equal('af-west-1');
    expect(res.result.data.datacenter.url).to.equal('http://af-west-1.joyent.com');
  });

  it('can get all datacenters', async () => {
    const datacenters = {
      'us-west-1': 'http://test.com'
    };

    StandIn.replaceOnce(CloudApi.prototype, 'fetch', () => {
      return datacenters;
    });

    const server = await ServerHelper.getServer({ apiBaseUrl: 'http://us-west-1.joyent.com' });
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
