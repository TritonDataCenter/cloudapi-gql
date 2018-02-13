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


describe('packages', () => {
  const packageObj = {
    id: '7b17343c-94af-6266-e0e8-893a3b9993d0',
    name: 'sdc_128',
    memory: 128,
    disk: 12288,
    swap: 256,
    vcpus: 1,
    lwps: 1000,
    default: false,
    version: '1.0.0'
  };

  it('can get all packages', async () => {
    const server = new Hapi.Server();
    StandIn.replaceOnce(CloudApi.prototype, 'fetch', (stand) => {
      return [packageObj];
    });

    await server.register({ plugin: CloudApiGql, options: { keyPath: Path.join(__dirname, 'test.key') } });
    await server.initialize();
    const res = await server.inject({
      url: '/graphql',
      method: 'post',
      payload: { query: 'query { packages { id name } }' }
    });
    expect(res.statusCode).to.equal(200);
    expect(res.result.data.packages.length).to.equal(1);
    expect(res.result.data.packages[0].id).to.equal(packageObj.id);
    expect(res.result.data.packages[0].name).to.equal(packageObj.name);
  });

  it('can get a package', async () => {
    const server = new Hapi.Server();
    StandIn.replaceOnce(CloudApi.prototype, 'fetch', (stand) => {
      return packageObj;
    });

    await server.register({ plugin: CloudApiGql, options: { keyPath: Path.join(__dirname, 'test.key') } });
    await server.initialize();
    const res = await server.inject({
      url: '/graphql',
      method: 'post',
      payload: { query: `query { package(id: "${packageObj.id}") { id name } }` }
    });
    expect(res.statusCode).to.equal(200);
    expect(res.result.data.package.id).to.equal(packageObj.id);
    expect(res.result.data.package.name).to.equal(packageObj.name);
  });
});
