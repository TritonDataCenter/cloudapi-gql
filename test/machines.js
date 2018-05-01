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
    metadata2: {
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

  const metadata = {
    root_authorized_keys: '...',
    group: 'test',
    credentials: {
      root: 'boo',
      admin: 'boo'
    }
  };

  it('can get all machines', async () => {
    const server = await ServerHelper.getServer();
    StandIn.replace(CloudApi.prototype, 'fetch', (stand) => {
      return { payload: [machine], res: { headers: { 'x-resource-count': 10 }} };
    }, { stopAfter: 2 });


    const res = await server.inject({
      url: '/graphql',
      method: 'post',
      payload: { query: 'query { machines { offset total results { id name } } }' }
    });
    expect(res.statusCode).to.equal(200);
    expect(res.result.data.machines.total).to.equal(10);
    expect(res.result.data.machines.offset).to.equal(0);
    expect(res.result.data.machines.results.length).to.equal(1);
    expect(res.result.data.machines.results[0].id).to.equal(machine.id);
    expect(res.result.data.machines.results[0].name).to.equal(machine.name);
  });

  it('can get a machine using machines(id)', async () => {
    const server = await ServerHelper.getServer();
    StandIn.replace(CloudApi.prototype, 'fetch', (stand) => {
      return machine;
    }, { stopAfter: 2 });


    const res = await server.inject({
      url: '/graphql',
      method: 'post',
      payload: { query: `query { machines(id: "${machine.id}" ) { offset total results { id name } } }` }
    });
    expect(res.statusCode).to.equal(200);
    expect(res.result.data.machines.offset).to.equal(0);
    expect(res.result.data.machines.results.length).to.equal(1);
    expect(res.result.data.machines.results[0].id).to.equal(machine.id);
    expect(res.result.data.machines.results[0].name).to.equal(machine.name);
  });

  it('can get machines using machines(brand, state)', async () => {
    const server = await ServerHelper.getServer();
    StandIn.replace(CloudApi.prototype, 'fetch', (stand, path, options) => {
      expect(options.query.brand).to.equal('joyent');
      expect(options.query.state).to.equal('running');
      return { payload: [machine], res: { headers: { 'x-resource-count': 10 } } };
    }, { stopAfter: 2 });


    const res = await server.inject({
      url: '/graphql',
      method: 'post',
      payload: { query: `query { machines(brand: ${machine.brand.toUpperCase()}, state: ${machine.state.toUpperCase()} ) { offset total results { id name } } }` }
    });
    expect(res.statusCode).to.equal(200);
    expect(res.result.data.machines.offset).to.equal(0);
    expect(res.result.data.machines.results.length).to.equal(1);
    expect(res.result.data.machines.results[0].id).to.equal(machine.id);
    expect(res.result.data.machines.results[0].name).to.equal(machine.name);
  });

  it('can get all machines with paging', async () => {
    const server = await ServerHelper.getServer();
    StandIn.replace(CloudApi.prototype, 'fetch', (stand) => {
      if (stand.invocations === 1) {
        return { payload: [machine, machine], res: { headers: { 'x-resource-count': 20 }} };
      }

      return { payload: [machine, machine], res: { headers: { 'x-resource-count': 10 }} };
    }, { stopAfter: 2 });


    const res = await server.inject({
      url: '/graphql',
      method: 'post',
      payload: { query: 'query { machines(offset: 1 limit: 2) { offset limit total results { id name } } }' }
    });
    expect(res.statusCode).to.equal(200);
    expect(res.result.data.machines.total).to.equal(20);
    expect(res.result.data.machines.offset).to.equal(1);
    expect(res.result.data.machines.limit).to.equal(2);
    expect(res.result.data.machines.results.length).to.equal(2);
    expect(res.result.data.machines.results[0].id).to.equal(machine.id);
    expect(res.result.data.machines.results[0].name).to.equal(machine.name);
  });

  it('can get a machine', async () => {
    const server = await ServerHelper.getServer();
    StandIn.replaceOnce(CloudApi.prototype, 'fetch', (stand) => {
      return machine;
    });


    const res = await server.inject({
      url: '/graphql',
      method: 'post',
      payload: { query: `query { machine(id: "${machine.id}") { id name } }` }
    });
    expect(res.statusCode).to.equal(200);
    expect(res.result.data.machine.id).to.equal(machine.id);
    expect(res.result.data.machine.name).to.equal(machine.name);
  });

  it('can get a machines metadata', async () => {
    const server = await ServerHelper.getServer();
    StandIn.replace(CloudApi.prototype, 'fetch', (stand) => {
      if (stand.invocations === 1) {
        return machine;
      }

      return metadata;
    }, { stopAfter: 2 });


    const res = await server.inject({
      url: '/graphql',
      method: 'post',
      payload: { query: `query { machine(id: "${machine.id}") { id name brand state metadata { name } } }` }
    });
    expect(res.statusCode).to.equal(200);
    expect(res.result.data.machine.id).to.equal(machine.id);
    expect(res.result.data.machine.name).to.equal(machine.name);
    expect(res.result.data.machine.metadata[0].name).to.equal(Object.keys(metadata)[0]);
  });

  it('can get a machines images', async () => {
    const image = {
      id: '2b683a82-a066-11e3-97ab-2faa44701c5a',
      name: 'base',
      version: '13.4.0',
      os: 'smartos',
      requirements: {},
      type: 'zone-dataset',
      description: 'A 32-bit SmartOS image with just essential packages installed. Ideal for users who are comfortable with setting up their own environment and tools.',
      files: [
        {
          compression: 'gzip',
          sha1: '3bebb6ae2cdb26eef20cfb30fdc4a00a059a0b7b',
          size: 110742036
        }
      ],
      tags: {
        role: 'os',
        group: 'base-32'
      },
      homepage: 'https://docs.joyent.com/images/smartos/base',
      published_at: '2014-02-28T10:50:42Z',
      owner: '930896af-bf8c-48d4-885c-6573a94b1853',
      public: true,
      state: 'active'
    };

    const server = await ServerHelper.getServer();
    StandIn.replace(CloudApi.prototype, 'fetch', (stand) => {
      if (stand.invocations === 1) {
        return machine;
      }

      return image;
    }, { stopAfter: 3 });


    const res = await server.inject({
      url: '/graphql',
      method: 'post',
      payload: { query: `query { machine(id: "${machine.id}") { id name image { name } } }` }
    });
    expect(res.statusCode).to.equal(200);
    expect(res.result.data.machine.id).to.equal(machine.id);
    expect(res.result.data.machine.name).to.equal(machine.name);
    expect(res.result.data.machine.image.name).to.equal(image.name);
  });

  it('can get a machines networks', async () => {
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

    const server = await ServerHelper.getServer();
    StandIn.replace(CloudApi.prototype, 'fetch', (stand) => {
      if (stand.invocations === 1) {
        return machine;
      }

      return network;
    }, { stopAfter: 3 });


    const res = await server.inject({
      url: '/graphql',
      method: 'post',
      payload: { query: `query { machine(id: "${machine.id}") { id name networks { name } } }` }
    });
    expect(res.statusCode).to.equal(200);
    expect(res.result.data.machine.id).to.equal(machine.id);
    expect(res.result.data.machine.name).to.equal(machine.name);
    expect(res.result.data.machine.networks[0].name).to.equal(network.name);
  });

  it('can get a machines snapshots', async () => {
    const snapshot = {
      name: 'just-booted',
      state: 'queued',
      created: '2011-07-05T17:19:26+00:00',
      updated: '2011-07-05T17:19:26+00:00'
    };

    const server = await ServerHelper.getServer();
    StandIn.replace(CloudApi.prototype, 'fetch', (stand) => {
      if (stand.invocations === 1) {
        return machine;
      }

      return [snapshot];
    }, { stopAfter: 2 });


    const res = await server.inject({
      url: '/graphql',
      method: 'post',
      payload: { query: `query { machine(id: "${machine.id}") { id name snapshots { name } } }` }
    });
    expect(res.statusCode).to.equal(200);
    expect(res.result.data.machine.id).to.equal(machine.id);
    expect(res.result.data.machine.name).to.equal(machine.name);
    expect(res.result.data.machine.snapshots[0].name).to.equal(snapshot.name);
  });

  it('can get a machines firewall rules', async () => {
    const firewallRule = {
      id: '38de17c4-39e8-48c7-a168-0f58083de860',
      rule: 'FROM vm 3d51f2d5-46f2-4da5-bb04-3238f2f64768 TO subnet 10.99.99.0/24 BLOCK tcp PORT 25',
      enabled: true,
      description: 'test'
    };

    const server = await ServerHelper.getServer();
    StandIn.replace(CloudApi.prototype, 'fetch', (stand) => {
      if (stand.invocations === 1) {
        return machine;
      }

      return [firewallRule];
    }, { stopAfter: 2 });


    const res = await server.inject({
      url: '/graphql',
      method: 'post',
      payload: { query: `query { machine(id: "${machine.id}") { id name firewall_rules { rule_str } } }` }
    });
    expect(res.statusCode).to.equal(200);
    expect(res.result.data.machine.id).to.equal(machine.id);
    expect(res.result.data.machine.name).to.equal(machine.name);
    expect(res.result.data.machine.firewall_rules[0].rule_str).to.equal(firewallRule.rule);
  });

  it('can get a machines actions', async () => {
    const audit = {
      success: 'yes',
      time: '2013-02-22T15:19:32.522Z',
      action: 'provision',
      caller: {
        type: 'signature',
        ip: '127.0.0.1',
        keyId: '/:login/keys/:fingerprint'
      }
    };

    const server = await ServerHelper.getServer();
    StandIn.replace(CloudApi.prototype, 'fetch', (stand) => {
      if (stand.invocations === 1) {
        return machine;
      }

      return [audit];
    }, { stopAfter: 2 });


    const res = await server.inject({
      url: '/graphql',
      method: 'post',
      payload: { query: `query { machine(id: "${machine.id}") { id name actions { name } } }` }
    });
    expect(res.statusCode).to.equal(200);
    expect(res.result.data.machine.id).to.equal(machine.id);
    expect(res.result.data.machine.name).to.equal(machine.name);
    expect(res.result.data.machine.actions[0].name).to.equal(audit.action);
  });

  it('can stop a machine', async () => {
    const server = await ServerHelper.getServer();
    StandIn.replace(CloudApi.prototype, 'fetch', (stand, path) => {
      const updatedMachine = Object.assign({}, machine, { state: 'stopping' });
      return updatedMachine;
    }, { stopAfter: 2 });


    const res = await server.inject({
      url: '/graphql',
      method: 'post',
      payload: { query: `mutation { stopMachine(id: "${machine.id}") { id state } }` }
    });

    expect(res.statusCode).to.equal(200);
    expect(res.result.data.stopMachine.id).to.equal(machine.id);
    expect(res.result.data.stopMachine.state).to.equal('STOPPING');
  });

  it('can start a machine', async () => {
    const server = await ServerHelper.getServer();
    StandIn.replace(CloudApi.prototype, 'fetch', (stand, path) => {
      const updatedMachine = Object.assign({}, machine, { state: 'running' });
      return updatedMachine;
    }, { stopAfter: 2 });


    const res = await server.inject({
      url: '/graphql',
      method: 'post',
      payload: { query: `mutation { startMachine(id: "${machine.id}") { id state } }` }
    });

    expect(res.statusCode).to.equal(200);
    expect(res.result.data.startMachine.id).to.equal(machine.id);
    expect(res.result.data.startMachine.state).to.equal('RUNNING');
  });

  it('can reboot a machine', async () => {
    const server = await ServerHelper.getServer();
    StandIn.replace(CloudApi.prototype, 'fetch', (stand, path) => {
      const updatedMachine = Object.assign({}, machine, { state: 'stopping' });
      return updatedMachine;
    }, { stopAfter: 2 });


    const res = await server.inject({
      url: '/graphql',
      method: 'post',
      payload: { query: `mutation { rebootMachine(id: "${machine.id}") { id state } }` }
    });

    expect(res.statusCode).to.equal(200);
    expect(res.result.data.rebootMachine.id).to.equal(machine.id);
    expect(res.result.data.rebootMachine.state).to.equal('STOPPING');
  });

  it('can rename a machine', async () => {
    const server = await ServerHelper.getServer();
    const updatedMachine = Object.assign({}, machine);
    StandIn.replace(CloudApi.prototype, 'fetch', (stand, path, options) => {
      if (options && options.query) {
        updatedMachine.name = options.query.name;
      }
      return updatedMachine;
    }, { stopAfter: 2 });


    const res = await server.inject({
      url: '/graphql',
      method: 'post',
      payload: { query: `mutation { renameMachine(id: "${machine.id}", name: "bacon-server") { id name } }` }
    });

    expect(res.statusCode).to.equal(200);
    expect(res.result.data.renameMachine.id).to.equal(machine.id);
    expect(res.result.data.renameMachine.name).to.equal('bacon-server');
  });

  it('can create a machine', async () => {
    const server = await ServerHelper.getServer();
    StandIn.replace(CloudApi.prototype, 'fetch', (stand, path, options) => {
      return machine;
    }, { stopAfter: 2 });


    const res = await server.inject({
      url: '/graphql',
      method: 'post',
      payload: { query: `mutation { createMachine(name: "${machine.name}", package: "${machine.package}", image: "${machine.image}" ) { id name } }` }
    });

    expect(res.statusCode).to.equal(200);
    expect(res.result.data.createMachine.id).to.equal(machine.id);
    expect(res.result.data.createMachine.name).to.equal(machine.name);
  });

  it('can create a machine with an affinity', async () => {
    const server = await ServerHelper.getServer();
    let payload;
    StandIn.replace(CloudApi.prototype, 'fetch', (stand, path, options) => {
      if (stand.invocations === 1) {
        payload = options.payload;
      }
      return machine;
    }, { stopAfter: 2 });


    const res = await server.inject({
      url: '/graphql',
      method: 'post',
      payload: { query: `mutation { 
        createMachine(
          name: "${machine.name}", 
          package: "${machine.package}", 
          image: "${machine.image}",
          affinity: [ { key: "instance", value: "bacon", type: MUST_EQUAL } ]
        ) { id name } }` }
    });

    expect(res.statusCode).to.equal(200);
    expect(res.result.data.createMachine.id).to.equal(machine.id);
    expect(res.result.data.createMachine.name).to.equal(machine.name);
    expect(payload.affinity).to.equal(['instance==bacon']);
  });

  it('can delete a machine', async () => {
    const server = await ServerHelper.getServer();
    StandIn.replace(CloudApi.prototype, 'fetch', (stand, path, options) => {
      return machine;
    }, { stopAfter: 2 });


    const res = await server.inject({
      url: '/graphql',
      method: 'post',
      payload: { query: `mutation { deleteMachine(id: "${machine.id}") { id name } }` }
    });

    expect(res.statusCode).to.equal(200);
    expect(res.result.data.deleteMachine.id).to.equal(machine.id);
    expect(res.result.data.deleteMachine.name).to.equal(machine.name);
  });

  it('can resize a machine', async () => {
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

    const server = await ServerHelper.getServer();
    StandIn.replace(CloudApi.prototype, 'fetch', (stand) => {
      if (stand.invocations === 1) {
        return '';
      } else if (stand.invocations === 2) {
        return machine;
      }

      return packageObj;
    }, { stopAfter: 3 });


    const res = await server.inject({
      url: '/graphql',
      method: 'post',
      payload: { query: `mutation { resizeMachine(id: "${machine.id}", package: "${packageObj.id}") { id package {id name} } }` }
    });

    expect(res.statusCode).to.equal(200);
    expect(res.result.data.resizeMachine.id).to.equal(machine.id);
    expect(res.result.data.resizeMachine.package.id).to.equal(packageObj.id);
    expect(res.result.data.resizeMachine.package.name).to.equal(packageObj.name);
  });

  describe('firewalls', () => {
    it('can enable a firewall for a machine', async () => {
      const server = await ServerHelper.getServer();
      StandIn.replace(CloudApi.prototype, 'fetch', () => {
        const result = Object.assign({}, machine, { firewall_enabled: true });
        return result;
      }, { stopAfter: 2 });


      const res = await server.inject({
        url: '/graphql',
        method: 'post',
        payload: { query: `mutation { enableMachineFirewall(id: "${machine.id}") { id firewall_enabled } }` }
      });
      expect(res.statusCode).to.equal(200);
      expect(res.result.data.enableMachineFirewall.id).to.equal(machine.id);
      expect(res.result.data.enableMachineFirewall.firewall_enabled).to.equal(true);
    });

    it('can disable a firewall for a machine', async () => {
      const server = await ServerHelper.getServer();
      StandIn.replace(CloudApi.prototype, 'fetch', () => {
        const result = Object.assign({}, machine, { firewall_enabled: false });
        return result;
      }, { stopAfter: 2 });


      const res = await server.inject({
        url: '/graphql',
        method: 'post',
        payload: { query: `mutation { disableMachineFirewall(id: "${machine.id}") { id firewall_enabled } }` }
      });
      expect(res.statusCode).to.equal(200);
      expect(res.result.data.disableMachineFirewall.id).to.equal(machine.id);
      expect(res.result.data.disableMachineFirewall.firewall_enabled).to.equal(false);
    });
  });

  describe('metadata', () => {
    it('can get all machine metadata', async () => {
      const server = await ServerHelper.getServer();
      StandIn.replaceOnce(CloudApi.prototype, 'fetch', (stand) => {
        return metadata;
      });


      const res = await server.inject({
        url: '/graphql',
        method: 'post',
        payload: { query: `query { metadata(machine: "${machine.id}") { name value } }` }
      });
      expect(res.statusCode).to.equal(200);
      expect(res.result.data.metadata.length).to.equal(3);
      expect(res.result.data.metadata[0].name).to.equal('root_authorized_keys');
    });

    it('can get an individual metadata value using metadata(name)', async () => {
      const server = await ServerHelper.getServer();
      StandIn.replaceOnce(CloudApi.prototype, 'fetch', (stand) => {
        return 'crispy';
      });


      const res = await server.inject({
        url: '/graphql',
        method: 'post',
        payload: { query: `query { metadata(machine: "${machine.id}", name: "bacon") { name value } }` }
      });
      expect(res.statusCode).to.equal(200);
      expect(res.result.data.metadata.length).to.equal(1);
      expect(res.result.data.metadata[0].name).to.equal('bacon');
      expect(res.result.data.metadata[0].value).to.equal('crispy');
    });

    it('can get an individual metadata value', async () => {
      const server = await ServerHelper.getServer();
      StandIn.replaceOnce(CloudApi.prototype, 'fetch', (stand) => {
        return 'bar';
      });


      const res = await server.inject({
        url: '/graphql',
        method: 'post',
        payload: { query: `query { metadataValue(machine: "${machine.id}", name: "foo") { name value } }` }
      });
      expect(res.statusCode).to.equal(200);
      expect(res.result.data.metadataValue.name).to.equal('foo');
      expect(res.result.data.metadataValue.value).to.equal('bar');
    });

    it('can update machine metadata', async () => {
      const server = await ServerHelper.getServer();
      StandIn.replace(CloudApi.prototype, 'fetch', (stand) => {
        if (stand.invocations === 1) {
          return { bacon: 'crispy' };
        }
        if (stand.invocations === 2) {
          return Object.assign({}, machine, { metadata: { bacon: 'crispy' } });
        }
        if (stand.invocations === 3) {
          return { bacon: 'crispy' };
        }
      }, { stopAfter: 3 });


      const res = await server.inject({
        url: '/graphql',
        method: 'post',
        payload: { query: `mutation {
          updateMachineMetadata(
            id: "${machine.id}",
            metadata: [ { name: "bacon", value: "crispy" } ]
          )
          { id metadata { name value } }
        }` }
      });
      expect(res.statusCode).to.equal(200);
      expect(res.result.data.updateMachineMetadata).to.exist();
      expect(res.result.data.updateMachineMetadata.metadata.length).to.equal(1);
      expect(res.result.data.updateMachineMetadata.metadata[0].name).to.equal('bacon');
      expect(res.result.data.updateMachineMetadata.metadata[0].value).to.equal('crispy');
    });

    it('can delete machine metadata', async () => {
      const server = await ServerHelper.getServer();
      StandIn.replace(CloudApi.prototype, 'fetch', (stand) => {
        if (stand.invocations === 1) {
          return {};
        }
        if (stand.invocations === 2) {
          return Object.assign({}, machine, { metadata: {} });
        }
        if (stand.invocations === 3) {
          return {};
        }
      }, { stopAfter: 2 });


      const res = await server.inject({
        url: '/graphql',
        method: 'post',
        payload: {
          query: `mutation {
          deleteMachineMetadata(
            id: "${machine.id}",
            name: "root_authorized_keys"
          )
          { id metadata { name value } }
        }` }
      });
      expect(res.statusCode).to.equal(200);
      expect(res.result.data.deleteMachineMetadata).to.exist();
      expect(res.result.data.deleteMachineMetadata.metadata.length).to.equal(0);
    });

    it('can delete all machine metadata', async () => {
      const server = await ServerHelper.getServer();
      StandIn.replace(CloudApi.prototype, 'fetch', (stand) => {
        if (stand.invocations === 1) {
          return {};
        }
        if (stand.invocations === 2) {
          return Object.assign({}, machine, { metadata: {} });
        }
        if (stand.invocations === 3) {
          return {};
        }
      }, { stopAfter: 2 });


      const res = await server.inject({
        url: '/graphql',
        method: 'post',
        payload: {
          query: `mutation {
          deleteAllMachineMetadata(
            id: "${machine.id}"
          )
          { id metadata { name value } }
        }` }
      });
      expect(res.statusCode).to.equal(200);
      expect(res.result.data.deleteAllMachineMetadata).to.exist();
      expect(res.result.data.deleteAllMachineMetadata.metadata.length).to.equal(0);
    });
  });

  describe('nics', () => {
    const nics = [{
      mac: '86:75:30:99:99:99',
      primary: true,
      ip: '10.88.88.137',
      netmask: '255.255.255.0',
      gateway: '10.88.88.2',
      state: 'running',
      network: '6b3229b6-c535-11e5-8cf9-c3a24fa96e35'
    }, {
      mac: '90:b8:d0:2f:b8:f9',
      primary: false,
      ip: '10.88.81.33',
      netmask: '255.255.255.0',
      gateway: '10.88.81.2',
      state: 'running',
      network: '6b3229b6-c535-11e5-8cf9-c3a24fa96e35'
    }];

    it('can get all the nics for a machine', async () => {
      const server = await ServerHelper.getServer();
      StandIn.replaceOnce(CloudApi.prototype, 'fetch', (stand) => {
        return nics;
      });


      const res = await server.inject({
        url: '/graphql',
        method: 'post',
        payload: { query: `query { nics(machine: "${machine.id}") { mac primary ip } }` }
      });
      expect(res.statusCode).to.equal(200);
      expect(res.result.data.nics.length).to.equal(2);
      expect(res.result.data.nics[0].mac).to.exist().and.to.equal('86:75:30:99:99:99');
      expect(res.result.data.nics[0].primary).to.exist().and.to.equal(true);
      expect(res.result.data.nics[0].ip).to.exist().and.to.equal('10.88.88.137');
    });

    it('can get a nic for a machine using nics(machine, mac)', async () => {
      const server = await ServerHelper.getServer();
      StandIn.replaceOnce(CloudApi.prototype, 'fetch', (stand) => {
        return nics[0];
      });


      const res = await server.inject({
        url: '/graphql',
        method: 'post',
        payload: { query: `query { nics(machine: "${machine.id}", mac: "${nics[0].mac}") { mac primary ip } }` }
      });
      expect(res.statusCode).to.equal(200);
      expect(res.result.data.nics.length).to.equal(1);
      expect(res.result.data.nics[0].mac).to.exist().and.to.equal('86:75:30:99:99:99');
      expect(res.result.data.nics[0].primary).to.exist().and.to.equal(true);
      expect(res.result.data.nics[0].ip).to.exist().and.to.equal('10.88.88.137');
    });

    it('can get a nic', async () => {
      const server = await ServerHelper.getServer();
      StandIn.replaceOnce(CloudApi.prototype, 'fetch', (stand) => {
        return nics[0];
      });


      const res = await server.inject({
        url: '/graphql',
        method: 'post',
        payload: { query: `query { nic(machine: "${machine.id}", mac: "${nics[0].mac}") { mac primary ip } }` }
      });
      expect(res.statusCode).to.equal(200);
      expect(res.result.data.nic).to.exist();
      expect(res.result.data.nic.mac).to.exist().and.to.equal('86:75:30:99:99:99');
      expect(res.result.data.nic.primary).to.exist().and.to.equal(true);
      expect(res.result.data.nic.ip).to.exist().and.to.equal('10.88.88.137');
    });

    it('can add a nic', async () => {
      const server = await ServerHelper.getServer();
      StandIn.replaceOnce(CloudApi.prototype, 'fetch', (stand) => {
        return nics[0];
      });


      const res = await server.inject({
        url: '/graphql',
        method: 'post',
        payload: { query: `mutation { addNic(machine: "${machine.id}", network: "${nics[0].network}") { mac primary ip } }` }
      });
      expect(res.statusCode).to.equal(200);
      expect(res.result.data.addNic).to.exist();
      expect(res.result.data.addNic.mac).to.exist().and.to.equal('86:75:30:99:99:99');
      expect(res.result.data.addNic.primary).to.exist().and.to.equal(true);
      expect(res.result.data.addNic.ip).to.exist().and.to.equal('10.88.88.137');
    });

    it('can remove a nic', async () => {
      const server = await ServerHelper.getServer();
      StandIn.replaceOnce(CloudApi.prototype, 'fetch', (stand) => {
        return nics[0];
      });


      const res = await server.inject({
        url: '/graphql',
        method: 'post',
        payload: { query: `mutation { removeNic(machine: "${machine.id}", mac: "${nics[0].mac}") { mac primary ip } }` }
      });
      expect(res.statusCode).to.equal(200);
      expect(res.result.data.removeNic).to.exist();
      expect(res.result.data.removeNic.mac).to.exist().and.to.equal('86:75:30:99:99:99');
      expect(res.result.data.removeNic.primary).to.exist().and.to.equal(true);
      expect(res.result.data.removeNic.ip).to.exist().and.to.equal('10.88.88.137');
    });
  });

  describe('snapshots', () => {
    const snapshots = [{
      name: 'bacon-server',
      state: 'queued',
      created: '2011-07-05T17:19:26+00:00',
      updated: '2011-07-05T17:19:26+00:00'
    }];

    it('can get all snapshots by machine', async () => {
      const server = await ServerHelper.getServer();
      StandIn.replaceOnce(CloudApi.prototype, 'fetch', (stand) => {
        return snapshots;
      });


      const res = await server.inject({
        url: '/graphql',
        method: 'post',
        payload: { query: `query { snapshots(machine: "${machine.id}") { name state } }` }
      });
      expect(res.statusCode).to.equal(200);
      expect(res.result.data.snapshots.length).to.equal(1);
      expect(res.result.data.snapshots[0].name).to.equal(snapshots[0].name);
      expect(res.result.data.snapshots[0].state).to.equal(snapshots[0].state.toUpperCase());
    });

    it('can get all snapshot by machine and name', async () => {
      const server = await ServerHelper.getServer();
      StandIn.replaceOnce(CloudApi.prototype, 'fetch', (stand) => {
        return snapshots[0];
      });


      const res = await server.inject({
        url: '/graphql',
        method: 'post',
        payload: { query: `query { snapshots(machine: "${machine.id}", name: "${snapshots[0].name}") { name state } }` }
      });
      expect(res.statusCode).to.equal(200);
      expect(res.result.data.snapshots.length).to.equal(1);
      expect(res.result.data.snapshots[0].name).to.equal(snapshots[0].name);
      expect(res.result.data.snapshots[0].state).to.equal(snapshots[0].state.toUpperCase());
    });

    it('can create a new snapshot', async () => {
      const server = await ServerHelper.getServer();
      StandIn.replaceOnce(CloudApi.prototype, 'fetch', (stand) => {
        return snapshots[0];
      });


      const res = await server.inject({
        url: '/graphql',
        method: 'post',
        payload: { query: `mutation { createMachineSnapshot(id: "${machine.id}", name: "${snapshots[0].name}") { name state } }` }
      });
      expect(res.statusCode).to.equal(200);
      expect(res.result.data.createMachineSnapshot.name).to.equal(snapshots[0].name);
      expect(res.result.data.createMachineSnapshot.state).to.equal(snapshots[0].state.toUpperCase());
    });

    it('can start a machine snapshot', async () => {
      const server = await ServerHelper.getServer();
      StandIn.replace(CloudApi.prototype, 'fetch', (stand) => {
        if (stand.invocations === 1) {
          return '';
        }
        return machine;
      }, { stopAfter: 2 });


      const res = await server.inject({
        url: '/graphql',
        method: 'post',
        payload: { query: `mutation { startMachineFromSnapshot(id: "${machine.id}", snapshot: "${snapshots[0].name}") { id name } }` }
      });
      expect(res.statusCode).to.equal(200);
      expect(res.result.data.startMachineFromSnapshot.id).to.equal(machine.id);
      expect(res.result.data.startMachineFromSnapshot.name).to.equal(machine.name);
    });

    it('can delete a machine snapshot', async () => {
      const server = await ServerHelper.getServer();
      StandIn.replace(CloudApi.prototype, 'fetch', (stand) => {
        if (stand.invocations === 1) {
          return '';
        }
        return machine;
      }, { stopAfter: 2 });


      const res = await server.inject({
        url: '/graphql',
        method: 'post',
        payload: { query: `mutation { deleteMachineSnapshot(id: "${machine.id}", snapshot: "${snapshots[0].name}") { id name } }` }
      });
      expect(res.statusCode).to.equal(200);
      expect(res.result.data.deleteMachineSnapshot.id).to.equal(machine.id);
      expect(res.result.data.deleteMachineSnapshot.name).to.equal(machine.name);
    });
  });

  describe('tags', () => {
    const tags = { bacon: 'crispy', nuts: 'salty' };
    it('can get a list of all tags for a machine', async () => {
      const server = await ServerHelper.getServer();
      StandIn.replaceOnce(CloudApi.prototype, 'fetch', (stand) => {
        return tags;
      });


      const res = await server.inject({
        url: '/graphql',
        method: 'post',
        payload: { query: `query { tags(machine: "${machine.id}") { name, value } }` }
      });
      expect(res.statusCode).to.equal(200);
      expect(res.result.data.tags.length).to.equal(2);
      expect(res.result.data.tags[0].name).to.exist().and.to.equal('bacon');
      expect(res.result.data.tags[0].value).to.exist().and.to.equal('crispy');
    });

    it('can get a tag for a machine by name', async () => {
      const server = await ServerHelper.getServer();
      StandIn.replaceOnce(CloudApi.prototype, 'fetch', (stand, path) => {
        const name = path.split('/').pop();
        expect(name).to.equal('bacon');
        return tags[name];
      });


      const res = await server.inject({
        url: '/graphql',
        method: 'post',
        payload: { query: `query { tags(machine: "${machine.id}", name: "bacon") { name, value } }` }
      });
      expect(res.statusCode).to.equal(200);
      expect(res.result.data.tags.length).to.equal(1);
      expect(res.result.data.tags[0].name).to.exist().and.to.equal('bacon');
      expect(res.result.data.tags[0].value).to.exist().and.to.equal('crispy');
    });

    it('can add a tag to a machine', async () => {
      const server = await ServerHelper.getServer();
      StandIn.replace(CloudApi.prototype, 'fetch', (stand, path, options) => {
        if (stand.invocations === 1) {
          expect(options.payload.steak).to.equal('medium-rare');
          return Object.assign({}, tags, options.payload);
        }
        if (stand.invocations === 2) {
          const machineWithTags = Object.assign({}, machine);
          machineWithTags.tags = Object.assign({}, tags, { steak: 'medium-rare', jenny: '8675309' });
          return machineWithTags;
        }
        return Object.assign({}, tags, { steak: 'medium-rare', jenny: '8675309' });
      }, { stopAfter: 3 });


      const res = await server.inject({
        url: '/graphql',
        method: 'post',
        payload: { query: `mutation {
          addMachineTags(id: "${machine.id}",
          tags: [ { name: "steak", value: "medium-rare" }, { name: "jenny", value: "8675309" } ] )
          { id, name, tags { name, value } } }` }
      });
      expect(res.statusCode).to.equal(200);
      const result = res.result.data.addMachineTags;
      expect(result.tags.length).to.equal(4);
      const steak = result.tags.find((t) => {
        return t.name === 'steak';
      });
      expect(steak.value).to.equal('medium-rare');
    });

    it('can replace machine tags', async () => {
      const server = await ServerHelper.getServer();
      StandIn.replace(CloudApi.prototype, 'fetch', (stand, path, options) => {
        if (stand.invocations === 1) {
          return options.payload;
        }
        if (stand.invocations === 2) {
          return machine;
        }
        return { steak: 'medium-rare', jenny: '8675309' };
      }, { stopAfter: 3 });


      const res = await server.inject({
        url: '/graphql',
        method: 'post',
        payload: {
          query: `mutation {
          replaceMachineTags(id: "${machine.id}",
          tags: [ { name: "steak", value: "medium-rare" }, { name: "jenny", value: "8675309" } ] )
          { id, name, tags { name, value } } }` }
      });
      expect(res.statusCode).to.equal(200);
      const result = res.result.data.replaceMachineTags;
      expect(result.tags.length).to.equal(2);
      const steak = result.tags.find((t) => {
        return t.name === 'steak';
      });
      expect(steak.value).to.equal('medium-rare');
    });

    it('can delete a machine tag', async () => {
      const server = await ServerHelper.getServer();
      StandIn.replace(CloudApi.prototype, 'fetch', (stand, path, options) => {
        if (stand.invocations === 1) {
          return '';
        }
        if (stand.invocations === 2) {
          return machine;
        }
        return { bacon: 'crispy' };
      }, { stopAfter: 3 });


      const res = await server.inject({
        url: '/graphql',
        method: 'post',
        payload: {
          query: `mutation {
          deleteMachineTag(id: "${machine.id}",
          name: "nuts" )
          { id, name, tags { name, value } } }` }
      });
      expect(res.statusCode).to.equal(200);
      const result = res.result.data.deleteMachineTag;
      expect(result.tags.length).to.equal(1);
      expect(result.tags[0].name).to.equal('bacon');
      expect(result.tags[0].value).to.equal('crispy');
    });

    it('can delete all machine tags', async () => {
      const server = await ServerHelper.getServer();
      StandIn.replace(CloudApi.prototype, 'fetch', (stand, path, options) => {
        if (stand.invocations === 1) {
          return '';
        }
        if (stand.invocations === 2) {
          return machine;
        }
        return {};
      }, { stopAfter: 3 });


      const res = await server.inject({
        url: '/graphql',
        method: 'post',
        payload: {
          query: `mutation {
          deleteMachineTags(id: "${machine.id}")
          { id, name, tags { name, value } } }` }
      });
      expect(res.statusCode).to.equal(200);
      const result = res.result.data.deleteMachineTags;
      expect(result.tags.length).to.equal(0);
    });
  });
});
