'use strict';

const Path = require('path');
const { expect } = require('code');
const Hapi = require('hapi');
const Lab = require('lab');
const StandIn = require('stand-in');
const CloudApiGql = require('../lib/');
const CloudApi = require('webconsole-cloudapi-client');


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

  const metadata = {
    foo: 'bar',
    group: 'test',
    credentials: {
      root: 'boo',
      admin: 'boo'
    }
  };

  it('can get all machines', async () => {
    const server = new Hapi.Server();
    StandIn.replace(CloudApi.prototype, 'fetch', (stand) => {
      return { payload: [machine], res: { headers: { 'x-resource-count': 10 }} };
    }, { stopAfter: 2 });

    await server.register(register);
    await server.initialize();
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

  it('can get all machines with paging', async () => {
    const server = new Hapi.Server();
    StandIn.replace(CloudApi.prototype, 'fetch', (stand) => {
      if (stand.invocations === 1) {
        return { payload: [machine, machine], res: { headers: { 'x-resource-count': 20 }} };
      }

      return { payload: [machine, machine], res: { headers: { 'x-resource-count': 10 }} };
    }, { stopAfter: 2 });

    await server.register(register);
    await server.initialize();
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
    const server = new Hapi.Server();
    StandIn.replaceOnce(CloudApi.prototype, 'fetch', (stand) => {
      return machine;
    });

    await server.register(register);
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

  it('can get a machines metadata', async () => {
    const server = new Hapi.Server();
    StandIn.replace(CloudApi.prototype, 'fetch', (stand) => {
      if (stand.invocations === 1) {
        return machine;
      }

      return metadata;
    }, { stopAfter: 2 });

    await server.register(register);
    await server.initialize();
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

    const server = new Hapi.Server();
    StandIn.replace(CloudApi.prototype, 'fetch', (stand) => {
      if (stand.invocations === 1) {
        return machine;
      }

      return image;
    }, { stopAfter: 3 });

    await server.register(register);
    await server.initialize();
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

    const server = new Hapi.Server();
    StandIn.replace(CloudApi.prototype, 'fetch', (stand) => {
      if (stand.invocations === 1) {
        return machine;
      }

      return network;
    }, { stopAfter: 3 });

    await server.register(register);
    await server.initialize();
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

    const server = new Hapi.Server();
    StandIn.replace(CloudApi.prototype, 'fetch', (stand) => {
      if (stand.invocations === 1) {
        return machine;
      }

      return [snapshot];
    }, { stopAfter: 2 });

    await server.register(register);
    await server.initialize();
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

    const server = new Hapi.Server();
    StandIn.replace(CloudApi.prototype, 'fetch', (stand) => {
      if (stand.invocations === 1) {
        return machine;
      }

      return [firewallRule];
    }, { stopAfter: 2 });

    await server.register(register);
    await server.initialize();
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

    const server = new Hapi.Server();
    StandIn.replace(CloudApi.prototype, 'fetch', (stand) => {
      if (stand.invocations === 1) {
        return machine;
      }

      return [audit];
    }, { stopAfter: 2 });

    await server.register(register);
    await server.initialize();
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
    const server = new Hapi.Server();
    StandIn.replace(CloudApi.prototype, 'fetch', (stand, path) => {
      const updatedMachine = Object.assign({}, machine, { state: 'stopping' });
      return updatedMachine;
    }, { stopAfter: 2 });

    await server.register(register);
    await server.initialize();
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
    const server = new Hapi.Server();
    StandIn.replace(CloudApi.prototype, 'fetch', (stand, path) => {
      const updatedMachine = Object.assign({}, machine, { state: 'running' });
      return updatedMachine;
    }, { stopAfter: 2 });

    await server.register(register);
    await server.initialize();
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
    const server = new Hapi.Server();
    StandIn.replace(CloudApi.prototype, 'fetch', (stand, path) => {
      const updatedMachine = Object.assign({}, machine, { state: 'stopping' });
      return updatedMachine;
    }, { stopAfter: 2 });

    await server.register(register);
    await server.initialize();
    const res = await server.inject({
      url: '/graphql',
      method: 'post',
      payload: { query: `mutation { rebootMachine(id: "${machine.id}") { id state } }` }
    });

    expect(res.statusCode).to.equal(200);
    expect(res.result.data.rebootMachine.id).to.equal(machine.id);
    expect(res.result.data.rebootMachine.state).to.equal('STOPPING');
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

    const server = new Hapi.Server();
    StandIn.replace(CloudApi.prototype, 'fetch', (stand) => {
      if (stand.invocations === 1) {
        return '';
      } else if (stand.invocations === 2) {
        return machine;
      }

      return packageObj;
    }, { stopAfter: 3 });

    await server.register(register);
    await server.initialize();
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
      const server = new Hapi.Server();
      StandIn.replace(CloudApi.prototype, 'fetch', () => {
        const result = Object.assign({}, machine, { firewall_enabled: true });
        return result;
      }, { stopAfter: 2 });

      await server.register(register);
      await server.initialize();
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
      const server = new Hapi.Server();
      StandIn.replace(CloudApi.prototype, 'fetch', () => {
        const result = Object.assign({}, machine, { firewall_enabled: false });
        return result;
      }, { stopAfter: 2 });

      await server.register(register);
      await server.initialize();
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
      const server = new Hapi.Server();
      StandIn.replaceOnce(CloudApi.prototype, 'fetch', (stand) => {
        return metadata;
      });

      await server.register(register);
      await server.initialize();
      const res = await server.inject({
        url: '/graphql',
        method: 'post',
        payload: { query: `query { metadata(machine: "${machine.id}") { name value } }` }
      });
      expect(res.statusCode).to.equal(200);
      expect(res.result.data.metadata.length).to.equal(3);
      expect(res.result.data.metadata[0].name).to.equal('foo');
    });

    it('can get an individual metadata value', async () => {
      const server = new Hapi.Server();
      StandIn.replaceOnce(CloudApi.prototype, 'fetch', (stand) => {
        return 'bar';
      });

      await server.register(register);
      await server.initialize();
      const res = await server.inject({
        url: '/graphql',
        method: 'post',
        payload: { query: `query { metadataValue(machine: "${machine.id}", name: "foo") { name value } }` }
      });
      expect(res.statusCode).to.equal(200);
      expect(res.result.data.metadataValue.name).to.equal('foo');
      expect(res.result.data.metadataValue.value).to.equal('bar');
    });
  });
});
