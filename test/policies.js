'use strict';

const Path = require('path');
const { expect } = require('code');
const Hapi = require('hapi');
const Lab = require('lab');
const StandIn = require('stand-in');
const CloudApiGql = require('../lib/');
const CloudApi = require('cloudapi-client');


const lab = exports.lab = Lab.script();
const { describe, it, afterEach } = lab;


describe('policies', () => {
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

  it('can get all policies', async () => {
    const policies = [{
      id: 'test',
      name: 'name',
      rules: ['foo', 'barr'],
      description: 'description'
    }];

    const server = new Hapi.Server();
    StandIn.replaceOnce(CloudApi.prototype, 'fetch', () => {
      return policies;
    });

    await server.register(register);
    await server.initialize();
    const res = await server.inject({
      url: '/graphql',
      method: 'post',
      payload: { query: 'query { policies { id, name, rules, description } }' }
    });
    expect(res.statusCode).to.equal(200);
    expect(res.result.data.policies).to.exist();
    expect(res.result.data.policies[0].id).to.equal(policies[0].id);
    expect(res.result.data.policies[0].name).to.equal(policies[0].name);
  });


  it('can get a single policy', async () => {
    const policy = {
      id: 'test',
      name: 'name',
      rules: ['foo', 'barr'],
      description: 'description'
    };

    const server = new Hapi.Server();
    StandIn.replaceOnce(CloudApi.prototype, 'fetch', () => {
      return policy;
    });

    await server.register(register);
    await server.initialize();
    const res = await server.inject({
      url: '/graphql',
      method: 'post',
      payload: { query: 'query { policy(id: "test") { id, name, rules, description } }' }
    });
    expect(res.statusCode).to.equal(200);
    expect(res.result.data.policy).to.exist();
    expect(res.result.data.policy.id).to.equal(policy.id);
    expect(res.result.data.policy.name).to.equal(policy.name);
  });
});
