'use strict';

const Path = require('path');
const { expect } = require('code');
const Hapi = require('hapi');
const Lab = require('lab');
const StandIn = require('stand-in');
const CloudApiGql = require('../lib/');
const CloudApi = require('webconsole-cloudapi-client');
const Graphi = require('graphi');


const lab = exports.lab = Lab.script();
const { describe, it, afterEach } = lab;


describe('roles', () => {
  afterEach(() => {
    StandIn.restoreAll();
  });

  const register = [
    {
      plugin: Graphi
    },
    {
      plugin: CloudApiGql,
      options: {
        keyPath: Path.join(__dirname, 'test.key'),
        keyId: 'test',
        apiBaseUrl: 'http://localhost'
      }
    }
  ];

  it('can get all roles', async () => {
    const roles = [{
      id: 'test',
      name: 'test'
    }];

    const server = new Hapi.Server();
    StandIn.replaceOnce(CloudApi.prototype, 'fetch', () => {
      return roles;
    });

    await server.register(register);
    await server.initialize();
    const res = await server.inject({
      url: '/graphql',
      method: 'post',
      payload: { query: 'query { roles { id, name } }' }
    });
    expect(res.statusCode).to.equal(200);
    expect(res.result.data.roles).to.exist();
    expect(res.result.data.roles[0].id).to.equal(roles[0].id);
    expect(res.result.data.roles[0].name).to.equal(roles[0].name);
    await server.stop();
  });

  it('can get a single role from calling roles(name)', async () => {
    const role = {
      id: 'test',
      name: 'test'
    };

    const server = new Hapi.Server();
    StandIn.replaceOnce(CloudApi.prototype, 'fetch', () => {
      return role;
    });

    await server.register(register);
    await server.initialize();
    const res = await server.inject({
      url: '/graphql',
      method: 'post',
      payload: { query: 'query { roles(name: "test") { id, name } }' }
    });
    expect(res.statusCode).to.equal(200);
    expect(res.result.data.roles).to.exist();
    expect(res.result.data.roles[0].id).to.equal(role.id);
    expect(res.result.data.roles[0].name).to.equal(role.name);
  });

  it('can get a single role from calling roles(id)', async () => {
    const role = {
      id: 'test',
      name: 'test'
    };

    const server = new Hapi.Server();
    StandIn.replaceOnce(CloudApi.prototype, 'fetch', () => {
      return role;
    });

    await server.register(register);
    await server.initialize();
    const res = await server.inject({
      url: '/graphql',
      method: 'post',
      payload: { query: 'query { roles(id: "test") { id, name } }' }
    });
    expect(res.statusCode).to.equal(200);
    expect(res.result.data.roles).to.exist();
    expect(res.result.data.roles[0].id).to.equal(role.id);
    expect(res.result.data.roles[0].name).to.equal(role.name);
  });

  it('can a single role by name', async () => {
    const role = {
      id: 'test',
      name: 'test'
    };

    const server = new Hapi.Server();
    StandIn.replaceOnce(CloudApi.prototype, 'fetch', () => {
      return role;
    });

    await server.register(register);
    await server.initialize();
    const res = await server.inject({
      url: '/graphql',
      method: 'post',
      payload: { query: 'query { role(name: "test") { id, name } }' }
    });
    expect(res.statusCode).to.equal(200);
    expect(res.result.data.role).to.exist();
    expect(res.result.data.role.id).to.equal(role.id);
    expect(res.result.data.role.name).to.equal(role.name);
  });

  it('can a single role by id', async () => {
    const role = {
      id: 'test',
      name: 'test'
    };

    const server = new Hapi.Server();
    StandIn.replaceOnce(CloudApi.prototype, 'fetch', () => {
      return role;
    });

    await server.register(register);
    await server.initialize();
    const res = await server.inject({
      url: '/graphql',
      method: 'post',
      payload: { query: 'query { role(id: "test") { id, name } }' }
    });
    expect(res.statusCode).to.equal(200);
    expect(res.result.data.role).to.exist();
    expect(res.result.data.role.id).to.equal(role.id);
    expect(res.result.data.role.name).to.equal(role.name);
  });

  it('can create a role', async () => {
    const role = {
      id: 'test',
      name: 'test',
      policies: [ {
        id: '38de17c4-39e8-48c7-a168-0f58083de860',
        name: 'test policy',
        rules: [],
        description: ''
      } ],
      members: [ {
        id: '3d51f2d5-46f2-4da5-bb04-3238f2f64768',
        name: 'test member'
      }]
    };

    const server = new Hapi.Server();
    StandIn.replaceOnce(CloudApi.prototype, 'fetch', () => {
      return role;
    });

    await server.register(register);
    await server.initialize();
    const res = await server.inject({
      url: '/graphql',
      method: 'post',
      payload: { query: 'mutation { createRole(name: "test", policies: ["38de17c4-39e8-48c7-a168-0f58083de860"], members: [ "3d51f2d5-46f2-4da5-bb04-3238f2f64768" ]) { id name policies { id name } members { id } } }' }
    });
    expect(res.statusCode).to.equal(200);
    expect(res.result.data.createRole).to.exist();
    expect(res.result.data.createRole.id).to.equal(role.id);
    expect(res.result.data.createRole.name).to.equal(role.name);
    expect(res.result.data.createRole.policies[0].id).to.equal(role.policies[0].id);
  });

  it('can update a role', async () => {
    const role = {
      id: 'test',
      name: 'test',
      policies: [{
        id: '38de17c4-39e8-48c7-a168-0f58083de860',
        name: 'test policy',
        rules: [],
        description: ''
      }],
      members: [{
        id: '3d51f2d5-46f2-4da5-bb04-3238f2f64768',
        name: 'test member'
      }]
    };

    const server = new Hapi.Server();
    StandIn.replaceOnce(CloudApi.prototype, 'fetch', () => {
      return role;
    });

    await server.register(register);
    await server.initialize();
    const res = await server.inject({
      url: '/graphql',
      method: 'post',
      payload: { query: 'mutation { updateRole(id: "test", policies: ["38de17c4-39e8-48c7-a168-0f58083de860"], members: [ "3d51f2d5-46f2-4da5-bb04-3238f2f64768" ]) { id name policies { id name } members { id } } }' }
    });
    expect(res.statusCode).to.equal(200);
    expect(res.result.data.updateRole).to.exist();
    expect(res.result.data.updateRole.id).to.equal(role.id);
    expect(res.result.data.updateRole.name).to.equal(role.name);
    expect(res.result.data.updateRole.policies[0].id).to.equal(role.policies[0].id);
  });

  it('can delete a role', async () => {
    const role = {
      id: 'test',
      name: 'test',
      policies: [{
        id: '38de17c4-39e8-48c7-a168-0f58083de860',
        name: 'test policy',
        rules: [],
        description: ''
      }],
      members: [{
        id: '3d51f2d5-46f2-4da5-bb04-3238f2f64768',
        name: 'test member'
      }]
    };

    const server = new Hapi.Server();
    StandIn.replaceOnce(CloudApi.prototype, 'fetch', () => {
      return role;
    });

    await server.register(register);
    await server.initialize();
    const res = await server.inject({
      url: '/graphql',
      method: 'post',
      payload: { query: 'mutation { deleteRole(id: "test") { id name policies { id name } members { id } } }' }
    });
    expect(res.statusCode).to.equal(200);
    expect(res.result.data.deleteRole).to.exist();
    expect(res.result.data.deleteRole.id).to.equal(role.id);
    expect(res.result.data.deleteRole.name).to.equal(role.name);
    expect(res.result.data.deleteRole.policies[0].id).to.equal(role.policies[0].id);
  });
});
