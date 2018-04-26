'use strict';

const { expect } = require('code');
const Lab = require('lab');
const StandIn = require('stand-in');
const CloudApi = require('webconsole-cloudapi-client');
const ServerHelper = require('./helpers/server');


const lab = exports.lab = Lab.script();
const { describe, it, afterEach } = lab;


describe('policies', () => {
  afterEach(() => {
    StandIn.restoreAll();
  });

  it('can get all policies', async () => {
    const policies = [{
      id: 'test',
      name: 'name',
      rules: ['foo', 'barr'],
      description: 'description'
    }];

    const server = await ServerHelper.getServer();
    StandIn.replaceOnce(CloudApi.prototype, 'fetch', () => {
      return policies;
    });


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

  it('can get all policies filtered by id', async () => {
    const policy = {
      id: 'test',
      name: 'name',
      rules: ['foo', 'barr'],
      description: 'description'
    };

    const server = await ServerHelper.getServer();
    StandIn.replaceOnce(CloudApi.prototype, 'fetch', () => {
      return policy;
    });


    const res = await server.inject({
      url: '/graphql',
      method: 'post',
      payload: { query: 'query { policies(id: "test") { id, name, rules, description } }' }
    });
    expect(res.statusCode).to.equal(200);
    expect(res.result.data.policies).to.exist();
    expect(res.result.data.policies[0].id).to.equal(policy.id);
    expect(res.result.data.policies[0].name).to.equal(policy.name);
  });

  it('can get a single policy', async () => {
    const policy = {
      id: 'test',
      name: 'name',
      rules: ['foo', 'barr'],
      description: 'description'
    };

    const server = await ServerHelper.getServer();
    StandIn.replaceOnce(CloudApi.prototype, 'fetch', () => {
      return policy;
    });


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

  it('can create a policy', async () => {
    const policy = {
      id: 'bacon',
      name: 'bacon policy',
      rules: ['crispy', 'not burnt'],
      description: 'bacon policy description'
    };

    const server = await ServerHelper.getServer();
    StandIn.replaceOnce(CloudApi.prototype, 'fetch', () => {
      return policy;
    });


    const res = await server.inject({
      url: '/graphql',
      method: 'post',
      payload: { query: `mutation { createPolicy(name: "${policy.name}", rules: ["crispy", "not burnt"], description: "${policy.description}") { id, name, rules, description } }` }
    });
    expect(res.statusCode).to.equal(200);
    expect(res.result.data.createPolicy).to.exist();
    expect(res.result.data.createPolicy.id).to.equal(policy.id);
    expect(res.result.data.createPolicy.name).to.equal(policy.name);
  });

  it('can update a policy', async () => {
    const policy = {
      id: 'bacon',
      name: 'bacon policy',
      rules: ['crispy', 'not burnt'],
      description: 'bacon policy description'
    };

    const server = await ServerHelper.getServer();
    StandIn.replaceOnce(CloudApi.prototype, 'fetch', (stand, path, options) => {
      return {
        id: policy.id,
        name: policy.name,
        rules: policy.rules,
        description: options.payload.description
      };
    });


    const res = await server.inject({
      url: '/graphql',
      method: 'post',
      payload: { query: `mutation { updatePolicy(id: "${policy.id}", description: "${policy.description} updated") { id, name, rules, description } }` }
    });
    expect(res.statusCode).to.equal(200);
    expect(res.result.data.updatePolicy).to.exist();
    expect(res.result.data.updatePolicy.id).to.equal(policy.id);
    expect(res.result.data.updatePolicy.name).to.equal(policy.name);
    expect(res.result.data.updatePolicy.description).to.equal(policy.description + ' updated');
  });

  it('can delete a policy', async () => {
    const policy = {
      id: 'bacon',
      name: 'bacon policy',
      rules: ['crispy', 'not burnt'],
      description: 'bacon policy description'
    };

    const server = await ServerHelper.getServer();
    StandIn.replace(CloudApi.prototype, 'fetch', (stand, path, options) => {
      return policy;
    }, { stopAfter: 2 });


    const res = await server.inject({
      url: '/graphql',
      method: 'post',
      payload: { query: `mutation { deletePolicy(id: "${policy.id}") { id, name, rules, description } }` }
    });
    expect(res.statusCode).to.equal(200);
    expect(res.result.data.deletePolicy).to.exist();
    expect(res.result.data.deletePolicy.id).to.equal(policy.id);
    expect(res.result.data.deletePolicy.name).to.equal(policy.name);
  });
});
