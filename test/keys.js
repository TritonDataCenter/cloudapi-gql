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


describe('keys', () => {
  it('can get all keys', async () => {
    const keys = [{
      name: 'test',
      fingerprint: 'fingerprint',
      value: 'foo'
    }];

    const server = new Hapi.Server();
    StandIn.replaceOnce(CloudApi.prototype, 'fetch', (stand) => {
      return keys;
    });

    await server.register({ plugin: CloudApiGql, options: { keyPath: Path.join(__dirname, 'test.key') } });
    await server.initialize();
    const res = await server.inject({
      url: '/graphql',
      method: 'post',
      payload: { query: 'query { keys { name fingerprint value } }' }
    });
    expect(res.statusCode).to.equal(200);
    expect(res.result.data.keys).to.exist();
    expect(res.result.data.keys[0].name).to.equal(keys[0].name);
    expect(res.result.data.keys[0].fingerprint).to.equal(keys[0].fingerprint);
    expect(res.result.data.keys[0].value).to.equal(keys[0].value);
  });

  it('can get a single key', async () => {
    const key = {
      name: 'test',
      fingerprint: 'fingerprint',
      value: 'foo'
    };

    const server = new Hapi.Server();
    StandIn.replaceOnce(CloudApi.prototype, 'fetch', (stand) => {
      return key;
    });

    await server.register({ plugin: CloudApiGql, options: { keyPath: Path.join(__dirname, 'test.key') } });
    await server.initialize();
    const res = await server.inject({
      url: '/graphql',
      method: 'post',
      payload: { query: 'query { key(name: "test") { name fingerprint value } }' }
    });
    expect(res.statusCode).to.equal(200);
    expect(res.result.data.key).to.exist();
    expect(res.result.data.key.name).to.equal(key.name);
    expect(res.result.data.key.fingerprint).to.equal(key.fingerprint);
    expect(res.result.data.key.value).to.equal(key.value);
  });

  it('can create a key', async () => {
    const server = new Hapi.Server();
    StandIn.replaceOnce(CloudApi.prototype, 'fetch', (stand, path, options) => {
      return {
        name: options.payload.name,
        value: options.payload.key,
        fingerprint: 'fingerprint'
      };
    });

    await server.register({ plugin: CloudApiGql, options: { keyPath: Path.join(__dirname, 'test.key') } });
    await server.initialize();
    const res = await server.inject({
      url: '/graphql',
      method: 'post',
      payload: { query: 'mutation { createKey(name: "test", key: "foo") { name fingerprint value } }' }
    });
    expect(res.statusCode).to.equal(200);
    expect(res.result.data.createKey).to.exist();
    expect(res.result.data.createKey.name).to.equal('test');
    expect(res.result.data.createKey.fingerprint).to.equal('fingerprint');
    expect(res.result.data.createKey.value).to.equal('foo');
  });

  it('can delete a key', async () => {
    const server = new Hapi.Server();
    StandIn.replaceOnce(CloudApi.prototype, 'fetch', (stand, path) => {
      return {
        name: path.split('/').pop()
      };
    });

    await server.register({ plugin: CloudApiGql, options: { keyPath: Path.join(__dirname, 'test.key') } });
    await server.initialize();
    const res = await server.inject({
      url: '/graphql',
      method: 'post',
      payload: { query: 'mutation { deleteKey(name: "test") { name } }' }
    });
    expect(res.statusCode).to.equal(200);
    expect(res.result.data.deleteKey).to.exist();
    expect(res.result.data.deleteKey.name).to.equal('test');
  });
});
