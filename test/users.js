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


describe('users', () => {
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

  const user = {
    id: '4fc13ac6-1e7d-cd79-f3d2-96276af0d638',
    login: 'barbar',
    email: 'barbar@example.com',
    companyName: 'Example',
    firstName: 'BarBar',
    lastName: 'Jinks',
    phone: '(123)457-6890',
    updated: '2015-12-23T06:41:11.032Z',
    created: '2015-12-23T06:41:11.032Z'
  };

  it('can get your account', async () => {
    const key = {
      name: 'test',
      fingerprint: 'fingerprint',
      value: 'foo'
    };

    const server = new Hapi.Server();
    StandIn.replace(CloudApi.prototype, 'fetch', (stand, path, options) => {
      if (stand.invocations === 1) {
        return user;
      }

      return key;
    }, { stopAfter: 2 });

    await server.register(register);
    await server.initialize();
    const res = await server.inject({
      url: '/graphql',
      method: 'post',
      payload: { query: 'query { account { login keys(name: "test") { name } } }' }
    });
    expect(res.statusCode).to.equal(200);
    expect(res.result.data.account).to.exist();
    expect(res.result.data.account.login).to.equal(user.login);
    expect(res.result.data.account.keys[0].name).to.equal(key.name);
  });

  it('can update your account', async () => {
    const server = new Hapi.Server();
    StandIn.replaceOnce(CloudApi.prototype, 'fetch', (stand, path, options) => {
      user.firstName = options.payload.firstName;
      return user;
    });

    await server.register(register);
    await server.initialize();
    const res = await server.inject({
      url: '/graphql',
      method: 'post',
      payload: { query: 'mutation { updateAccount(firstName: "Boom") { login firstName } }' }
    });

    expect(res.statusCode).to.equal(200);
    expect(res.result.data.updateAccount).to.exist();
    expect(res.result.data.updateAccount.login).to.equal(user.login);
    expect(res.result.data.updateAccount.firstName).to.equal('Boom');
  });

  it('can create a subuser', async () => {
    const server = new Hapi.Server();
    StandIn.replaceOnce(CloudApi.prototype, 'fetch', (stand, path, options) => {
      return user;
    });

    await server.register(register);
    await server.initialize();
    const res = await server.inject({
      url: '/graphql',
      method: 'post',
      payload: { query: 'mutation { createUser(email: "email", login: "test") { login } }' }
    });

    expect(res.statusCode).to.equal(200);
    expect(res.result.data.createUser).to.exist();
    expect(res.result.data.createUser.login).to.equal(user.login);
  });

  it('can query for a user', async () => {
    const keys = [{
      name: 'test',
      fingerprint: 'fingerprint',
      value: 'foo'
    }];

    const server = new Hapi.Server();
    StandIn.replace(CloudApi.prototype, 'fetch', (stand) => {
      if (stand.invocations === 1) {
        return user;
      }

      return keys;
    }, { stopAfter: 2 });

    await server.register(register);
    await server.initialize();
    const res = await server.inject({
      url: '/graphql',
      method: 'post',
      payload: { query: 'query { user(id: "foo") { login keys { name } } }' }
    });
    expect(res.statusCode).to.equal(200);
    expect(res.result.data.user).to.exist();
    expect(res.result.data.user.login).to.equal(user.login);
    expect(res.result.data.user.keys[0].name).to.equal(keys[0].name);
  });

  it('can query for users', async () => {
    const server = new Hapi.Server();
    StandIn.replaceOnce(CloudApi.prototype, 'fetch', (stand) => {
      return [user];
    });

    await server.register(register);
    await server.initialize();
    const res = await server.inject({
      url: '/graphql',
      method: 'post',
      payload: { query: 'query { users { login } }' }
    });
    expect(res.statusCode).to.equal(200);
    expect(res.result.data.users).to.exist();
    expect(res.result.data.users[0].login).to.equal(user.login);
  });
});
