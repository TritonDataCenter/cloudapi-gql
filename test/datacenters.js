'use strict';

const Path = require('path');
const { expect } = require('code');
const Hapi = require('hapi');
const Lab = require('lab');
const StandIn = require('stand-in');
const CloudApiGql = require('../lib/');
const CloudApi = require('webconsole-cloudapi-client');


const lab = exports.lab = Lab.script();
const { describe, it, afterEach } = lab;


describe('datacenters', () => {
  afterEach(() => {
    StandIn.restoreAll();
  });

  const register = {
    plugin: CloudApiGql,
    options: {
      keyPath: Path.join(__dirname, 'test.key'),
      keyId: 'test',
      apiBaseUrl: 'http://us-west-1.joyent.com'
    }
  };

  it('can get the current datacenter', async () => {
    const server = new Hapi.Server();
    StandIn.replaceOnce(CloudApi.prototype, 'fetch', (stand, path) => {
      expect(path).to.contain('us-west-1');
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

    await server.register(register);
    await server.initialize();
    const res = await server.inject({
      url: '/graphql',
      method: 'post',
      payload: { query: 'query { datacenter { name, place, url } }' }
    });
    expect(res.statusCode).to.equal(200);
    expect(res.result.data.datacenter.place).to.equal('Americas');
    expect(res.result.data.datacenter.name).to.equal('us-west-1');
    expect(res.result.data.datacenter.url).to.equal('http://us-west-1.joyent.com');
  });

  it('can get the current datacenter configured by dcName', async () => {
    const server = new Hapi.Server();
    StandIn.replaceOnce(CloudApi.prototype, 'fetch', (stand, path) => {
      expect(path).to.contain('us-west-1');
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

    await server.register({
      plugin: CloudApiGql,
      options: {
        keyPath: Path.join(__dirname, 'test.key'),
        keyId: 'test',
        apiBaseUrl: 'http://localhost',
        dcName: 'us-west-1'
      }
    });
    await server.initialize();
    const res = await server.inject({
      url: '/graphql',
      method: 'post',
      payload: { query: 'query { datacenter { name, place, url } }' }
    });
    expect(res.statusCode).to.equal(200);
    expect(res.result.data.datacenter.place).to.equal('Americas');
    expect(res.result.data.datacenter.name).to.equal('us-west-1');
    expect(res.result.data.datacenter.url).to.equal('http://us-west-1.joyent.com');
  });

  it('can get a single datacenter by name', async () => {
    const server = new Hapi.Server();
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

    await server.register(register);
    await server.initialize();
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
    const server = new Hapi.Server();
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

    await server.register(register);
    await server.initialize();
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

    const server = new Hapi.Server();
    StandIn.replaceOnce(CloudApi.prototype, 'fetch', () => {
      return datacenters;
    });

    await server.register(register);
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
