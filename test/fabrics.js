'use strict';

const Path = require('path');
const { expect } = require('code');
const Hapi = require('hapi');
const Lab = require('lab');
const StandIn = require('stand-in');
const CloudApiGql = require('../lib/');
const CloudApi = require('../lib/cloudapi');


const lab = exports.lab = Lab.script();
const { describe, it, afterEach } = lab;


describe('machines', () => {
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

  const network = {
    id: '7326787b-8039-436c-a533-5038f7280f04',
    name: 'default',
    public: false,
    fabric: true,
    gateway: '192.168.128.1',
    internet_nat: true,
    provision_end_ip: '192.168.131.250',
    provision_start_ip: '192.168.128.5',
    resolvers: [
      '8.8.8.8',
      '8.8.4.4'
    ],
    subnet: '192.168.128.0/22',
    vlan_id: 2
  };

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
      '7326787b-8039-436c-a533-5038f7280f04',
      '45607081-4cd2-45c8-baf7-79da760fffaa'
    ],
    primaryIp: '10.88.88.26',
    firewall_enabled: false,
    compute_node: '564d0b8e-6099-7648-351e-877faf6c56f6',
    package: 'sdc_128'
  };

  it('can get a single network', async () => {
    const server = new Hapi.Server();
    StandIn.replace(CloudApi.prototype, 'fetch', (stand) => {
      if (stand.invocations === 1) {
        return network;
      }

      return [machine];
    }, { stopAfter: 2 });

    await server.register(register);
    await server.initialize();
    const res = await server.inject({
      url: '/graphql',
      method: 'post',
      payload: { query: `query { network(id: "${network.id}") { id name machines { name } } }` }
    });
    expect(res.statusCode).to.equal(200);
    expect(res.result.data.network).to.exist();
    expect(res.result.data.network.id).to.equal(network.id);
    expect(res.result.data.network.name).to.equal(network.name);
    expect(res.result.data.network.machines[0].name).to.equal(machine.name);
  });

  it('can get all networks', async () => {
    const server = new Hapi.Server();
    StandIn.replaceOnce(CloudApi.prototype, 'fetch', (stand) => {
      return [network];
    });

    await server.register(register);
    await server.initialize();
    const res = await server.inject({
      url: '/graphql',
      method: 'post',
      payload: { query: 'query { networks { id name } }' }
    });
    expect(res.statusCode).to.equal(200);
    expect(res.result.data.networks).to.exist();
    expect(res.result.data.networks[0].id).to.equal(network.id);
    expect(res.result.data.networks[0].name).to.equal(network.name);
  });

  it('can create a VLAN', async () => {
    const vlan = {
      vlan_id: 1,
      name: 'test',
      description: 'test'
    };
    const server = new Hapi.Server();
    StandIn.replaceOnce(CloudApi.prototype, 'fetch', (stand) => {
      return vlan;
    });

    await server.register(register);
    await server.initialize();
    const res = await server.inject({
      url: '/graphql',
      method: 'post',
      payload: { query: 'mutation { createVLAN(id: 1, name: "test", description: "test") { id name description } }' }
    });
    expect(res.statusCode).to.equal(200);
    expect(res.result.data.createVLAN).to.exist();
    expect(res.result.data.createVLAN.id).to.equal(vlan.vlan_id);
    expect(res.result.data.createVLAN.name).to.equal(vlan.name);
    expect(res.result.data.createVLAN.description).to.equal(vlan.description);
  });
});
