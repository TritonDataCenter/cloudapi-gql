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


describe('roles', () => {
  it('can get all roles', async () => {
    const roles = [{
      id: 'test',
      name: 'test'
    }];

    const server = new Hapi.Server();
    StandIn.replaceOnce(CloudApi.prototype, 'fetch', () => {
      return roles;
    });

    await server.register({ plugin: CloudApiGql, options: { keyPath: Path.join(__dirname, 'test.key') } });
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

    await server.register({ plugin: CloudApiGql, options: { keyPath: Path.join(__dirname, 'test.key') } });
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

  it('can a single role', async () => {
    const role = {
      id: 'test',
      name: 'test'
    };

    const server = new Hapi.Server();
    StandIn.replaceOnce(CloudApi.prototype, 'fetch', () => {
      return role;
    });

    await server.register({ plugin: CloudApiGql, options: { keyPath: Path.join(__dirname, 'test.key') } });
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
});
