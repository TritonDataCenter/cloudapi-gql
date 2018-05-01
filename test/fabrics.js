'use strict';

const { expect } = require('code');
const Lab = require('lab');
const StandIn = require('stand-in');
const CloudApi = require('webconsole-cloudapi-client');
const ServerHelper = require('./helpers');

const lab = exports.lab = Lab.script();
const { describe, it, afterEach } = lab;


describe('machines', () => {
  afterEach(() => {
    StandIn.restoreAll();
  });

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
    StandIn.replace(CloudApi.prototype, 'fetch', (stand) => {
      if (stand.invocations === 1) {
        return network;
      }

      return [machine];
    }, { stopAfter: 2 });

    const server = await ServerHelper.getServer();
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
    StandIn.replaceOnce(CloudApi.prototype, 'fetch', (stand) => {
      return [network];
    });

    const server = await ServerHelper.getServer();
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

  it('can filter networks to a single network by id', async () => {
    StandIn.replace(CloudApi.prototype, 'fetch', (stand) => {
      if (stand.invocations === 1) {
        return network;
      }

      return [machine];
    }, { stopAfter: 2 });

    const server = await ServerHelper.getServer();
    const res = await server.inject({
      url: '/graphql',
      method: 'post',
      payload: { query: `query { networks(id: "${network.id}") { id name machines { name } } }` }
    });
    expect(res.statusCode).to.equal(200);
    expect(res.result.data.networks).to.exist();
    expect(res.result.data.networks.length).to.equal(1);
    expect(res.result.data.networks[0].id).to.equal(network.id);
    expect(res.result.data.networks[0].name).to.equal(network.name);
    expect(res.result.data.networks[0].machines[0].name).to.equal(machine.name);
  });

  it('can create a network', async () => {
    StandIn.replace(CloudApi.prototype, 'fetch', (stand) => {
      if (stand.invocations === 1) {
        return network;
      }

      return [machine];
    }, { stopAfter: 2 });

    const server = await ServerHelper.getServer();
    const res = await server.inject({
      url: '/graphql',
      method: 'post',
      payload: { query: `mutation { createNetwork(vlan: ${network.vlan_id}, name: "test", subnet: "10.24.33.1/24") { id name machines { name } } }` }
    });
    expect(res.statusCode).to.equal(200);
    expect(res.result.data.createNetwork).to.exist();
    expect(res.result.data.createNetwork.id).to.equal(network.id);
    expect(res.result.data.createNetwork.name).to.equal(network.name);
    expect(res.result.data.createNetwork.machines[0].name).to.equal(machine.name);
  });

  it('can delete a network', async () => {
    StandIn.replace(CloudApi.prototype, 'fetch', (stand) => {
      if (stand.invocations === 1) {
        return network;
      }

      return [machine];
    }, { stopAfter: 2 });

    const server = await ServerHelper.getServer();
    const res = await server.inject({
      url: '/graphql',
      method: 'post',
      payload: { query: `mutation { deleteNetwork(vlan: ${network.vlan_id}, id: "${network.id}") { id name } }` }
    });
    expect(res.statusCode).to.equal(200);
    expect(res.result.data.deleteNetwork).to.exist();
    expect(res.result.data.deleteNetwork.id).to.equal(network.id);
    expect(res.result.data.deleteNetwork.name).to.equal(network.name);
  });

  it('can filter networks to a vlan', async () => {
    StandIn.replace(CloudApi.prototype, 'fetch', (stand) => {
      if (stand.invocations === 1) {
        return [network];
      }

      return [machine];
    }, { stopAfter: 2 });

    const server = await ServerHelper.getServer();
    const res = await server.inject({
      url: '/graphql',
      method: 'post',
      payload: { query: `query { networks(vlan: ${network.vlan_id}) { id name machines { name } } }` }
    });
    expect(res.statusCode).to.equal(200);
    expect(res.result.data.networks).to.exist();
    expect(res.result.data.networks.length).to.equal(1);
    expect(res.result.data.networks[0].id).to.equal(network.id);
    expect(res.result.data.networks[0].name).to.equal(network.name);
    expect(res.result.data.networks[0].machines[0].name).to.equal(machine.name);
  });

  it('can get all vlans', async () => {
    const vlans = [{
      vlan_id: 1,
      name: 'test',
      description: 'test'
    }, {
      vlan_id: 2,
      name: 'test2',
      description: 'test2'
    }];
    StandIn.replaceOnce(CloudApi.prototype, 'fetch', (stand) => {
      return vlans;
    });

    const server = await ServerHelper.getServer();
    const res = await server.inject({
      url: '/graphql',
      method: 'post',
      payload: { query: '{ vlans { id name description } }' }
    });
    expect(res.statusCode).to.equal(200);
    expect(res.result.data.vlans).to.exist();
    expect(res.result.data.vlans.length).to.equal(2);
    expect(res.result.data.vlans[0].id).to.equal(vlans[0].vlan_id);
    expect(res.result.data.vlans[0].name).to.equal(vlans[0].name);
    expect(res.result.data.vlans[0].description).to.equal(vlans[0].description);
  });

  it('can get filter vlans by id', async () => {
    const vlan = {
      vlan_id: 1,
      name: 'test',
      description: 'test'
    };
    StandIn.replaceOnce(CloudApi.prototype, 'fetch', (stand) => {
      return vlan;
    });

    const server = await ServerHelper.getServer();
    const res = await server.inject({
      url: '/graphql',
      method: 'post',
      payload: { query: '{ vlans(id: 1) { id name description } }' }
    });
    expect(res.statusCode).to.equal(200);
    expect(res.result.data.vlans).to.exist();
    expect(res.result.data.vlans.length).to.equal(1);
    expect(res.result.data.vlans[0].id).to.equal(vlan.vlan_id);
    expect(res.result.data.vlans[0].name).to.equal(vlan.name);
    expect(res.result.data.vlans[0].description).to.equal(vlan.description);
  });

  it('can get a vlan by id', async () => {
    const vlan = {
      vlan_id: 1,
      name: 'test',
      description: 'test'
    };
    StandIn.replaceOnce(CloudApi.prototype, 'fetch', (stand) => {
      return vlan;
    });

    const server = await ServerHelper.getServer();
    const res = await server.inject({
      url: '/graphql',
      method: 'post',
      payload: { query: '{ vlan(id: 1) { id name description } }' }
    });
    expect(res.statusCode).to.equal(200);
    expect(res.result.data.vlan).to.exist();
    expect(res.result.data.vlan.id).to.equal(vlan.vlan_id);
    expect(res.result.data.vlan.name).to.equal(vlan.name);
    expect(res.result.data.vlan.description).to.equal(vlan.description);
  });

  it('can create a VLAN', async () => {
    const vlan = {
      vlan_id: 1,
      name: 'test',
      description: 'test'
    };
    StandIn.replaceOnce(CloudApi.prototype, 'fetch', (stand) => {
      return vlan;
    });

    const server = await ServerHelper.getServer();
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

  it('can update a VLAN', async () => {
    const vlan = {
      vlan_id: 1,
      name: 'update-test',
      description: 'update-test-description'
    };
    StandIn.replaceOnce(CloudApi.prototype, 'fetch', (stand) => {
      return vlan;
    });

    const server = await ServerHelper.getServer();
    const res = await server.inject({
      url: '/graphql',
      method: 'post',
      payload: { query: 'mutation { updateVLAN(id: 1, name: "update-test", description: "update-test-description") { id name description } }' }
    });
    expect(res.statusCode).to.equal(200);
    expect(res.result.data.updateVLAN).to.exist();
    expect(res.result.data.updateVLAN.id).to.equal(vlan.vlan_id);
    expect(res.result.data.updateVLAN.name).to.equal(vlan.name);
    expect(res.result.data.updateVLAN.description).to.equal(vlan.description);
  });

  it('can delete a VLAN', async () => {
    const vlan = {
      vlan_id: 1,
      name: 'test',
      description: 'test'
    };
    StandIn.replaceOnce(CloudApi.prototype, 'fetch', (stand) => {
      return vlan;
    });

    const server = await ServerHelper.getServer();
    const res = await server.inject({
      url: '/graphql',
      method: 'post',
      payload: { query: 'mutation { deleteVLAN(id: 1) { id name description } }' }
    });
    expect(res.statusCode).to.equal(200);
    expect(res.result.data.deleteVLAN).to.exist();
    expect(res.result.data.deleteVLAN.id).to.equal(vlan.vlan_id);
    expect(res.result.data.deleteVLAN.name).to.equal(vlan.name);
    expect(res.result.data.deleteVLAN.description).to.equal(vlan.description);
  });
});
