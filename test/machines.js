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


describe('machines', () => {
  const machine = {
    id: 'b6979942-7d5d-4fe6-a2ec-b812e950625a',
    name: 'test',
    type: 'smartmachine',
    brand: 'joyent',
    state: 'running',
    image: '2b683a82-a066-11e3-97ab-2faa44701c5a',
    ips: [
      '10.88.88.26',
      '192.168.128.5'
    ],
    memory: 128,
    disk: 12288,
    metadata: {
      root_authorized_keys: '...'
    },
    tags: {},
    created: '2016-01-04T12:55:50.539Z',
    updated: '2016-01-21T08:56:59.000Z',
    networks: [
      'a9c130da-e3ba-40e9-8b18-112aba2d3ba7',
      '45607081-4cd2-45c8-baf7-79da760fffaa'
    ],
    primaryIp: '10.88.88.26',
    firewall_enabled: false,
    compute_node: '564d0b8e-6099-7648-351e-877faf6c56f6',
    package: 'sdc_128'
  };

  it('can get all machines', async () => {
    const server = new Hapi.Server();
    StandIn.replaceOnce(CloudApi.prototype, 'fetch', (stand) => {
      return [machine];
    });

    await server.register({ plugin: CloudApiGql, options: { keyPath: Path.join(__dirname, 'test.key') } });
    await server.initialize();
    const res = await server.inject({
      url: '/graphql',
      method: 'post',
      payload: { query: 'query { machines { id name } }' }
    });
    expect(res.statusCode).to.equal(200);
    expect(res.result.data.machines.length).to.equal(1);
    expect(res.result.data.machines[0].id).to.equal(machine.id);
    expect(res.result.data.machines[0].name).to.equal(machine.name);
  });

  it('can get a machine', async () => {
    const server = new Hapi.Server();
    StandIn.replaceOnce(CloudApi.prototype, 'fetch', (stand) => {
      return machine;
    });

    await server.register({ plugin: CloudApiGql, options: { keyPath: Path.join(__dirname, 'test.key') } });
    await server.initialize();
    const res = await server.inject({
      url: '/graphql',
      method: 'post',
      payload: { query: `query { machine(id: "${machine.id}") { id name } }` }
    });
    expect(res.statusCode).to.equal(200);
    expect(res.result.data.machine.id).to.equal(machine.id);
    expect(res.result.data.machine.name).to.equal(machine.name);
  });
});
