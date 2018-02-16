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

  it('can stop a machine', async () => {
    const server = new Hapi.Server();
    StandIn.replace(CloudApi.prototype, 'fetch', (stand, path) => {
      const updatedMachine = Object.assign({}, machine, { state: 'stopping' });
      return updatedMachine;
    }, { stopAfter: 2 });

    await server.register({ plugin: CloudApiGql, options: { keyPath: Path.join(__dirname, 'test.key') } });
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

    await server.register({ plugin: CloudApiGql, options: { keyPath: Path.join(__dirname, 'test.key') } });
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

    await server.register({ plugin: CloudApiGql, options: { keyPath: Path.join(__dirname, 'test.key') } });
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

    await server.register({ plugin: CloudApiGql, options: { keyPath: Path.join(__dirname, 'test.key') } });
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

      await server.register({ plugin: CloudApiGql, options: { keyPath: Path.join(__dirname, 'test.key') } });
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

      await server.register({ plugin: CloudApiGql, options: { keyPath: Path.join(__dirname, 'test.key') } });
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
    const metadata = {
      foo: 'bar',
      group: 'test',
      credentials: {
        root: 'boo',
        admin: 'boo'
      }
    };

    it('can get all machine metadata', async () => {
      const server = new Hapi.Server();
      StandIn.replaceOnce(CloudApi.prototype, 'fetch', (stand) => {
        return metadata;
      });

      await server.register({ plugin: CloudApiGql, options: { keyPath: Path.join(__dirname, 'test.key') } });
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

      await server.register({ plugin: CloudApiGql, options: { keyPath: Path.join(__dirname, 'test.key') } });
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
