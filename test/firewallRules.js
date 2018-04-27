'use strict';

const { expect } = require('code');
const CloudApi = require('webconsole-cloudapi-client');
const Lab = require('lab');
const StandIn = require('stand-in');
const TestDouble = require('testdouble');


const ServerHelper = require('./helpers/server');
const FirewallRules = require('../lib/handlers/firewallRules');


const lab = exports.lab = Lab.script();
const { describe, it, afterEach } = lab;


describe('firewallRules', () => {
  afterEach(() => {
    StandIn.restoreAll();
    TestDouble.reset();
  });

  const firewallRule = {
    id: '38de17c4-39e8-48c7-a168-0f58083de860',
    rule: 'FROM vm 3d51f2d5-46f2-4da5-bb04-3238f2f64768 TO subnet 10.99.99.0/24 BLOCK tcp PORT 25',
    enabled: true,
    description: 'test'
  };

  it('can list firewall rules', async () => {
    StandIn.replaceOnce(CloudApi.prototype, 'fetch', () => {
      return [firewallRule];
    });

    const server = await ServerHelper.getServer();
    const res = await server.inject({
      url: '/graphql',
      method: 'post',
      payload: { query: 'query { firewall_rules { id rule_str enabled } }' }
    });
    expect(res.statusCode).to.equal(200);
    expect(res.result.data.firewall_rules[0].id).to.equal(firewallRule.id);
    expect(res.result.data.firewall_rules[0].rule_str).to.equal(firewallRule.rule);
    expect(res.result.data.firewall_rules[0].enabled).to.equal(firewallRule.enabled);
  });

  it('can get a firewall rule', async () => {
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

    StandIn.replace(CloudApi.prototype, 'fetch', (stand) => {
      if (stand.invocations === 1) {
        return firewallRule;
      }
      return [machine];
    }, { stopAfter: 2 });

    const server = await ServerHelper.getServer();
    const res = await server.inject({
      url: '/graphql',
      method: 'post',
      payload: { query: `query { firewall_rules(id: "${firewallRule.id}") { id rule_str enabled rule_obj machines { name } } }` }
    });
    expect(res.statusCode).to.equal(200);
    expect(res.result.data.firewall_rules[0].id).to.equal(firewallRule.id);
    expect(res.result.data.firewall_rules[0].rule_str).to.equal(firewallRule.rule);
    expect(res.result.data.firewall_rules[0].enabled).to.equal(firewallRule.enabled);
    expect(res.result.data.firewall_rules[0].rule_str).to.equal(firewallRule.rule);
    expect(res.result.data.firewall_rules[0].machines[0].name).to.equal(machine.name);
  });

  it('can create a firewall rule', async () => {
    StandIn.replaceOnce(CloudApi.prototype, 'fetch', () => {
      return firewallRule;
    });

    const server = await ServerHelper.getServer();
    const res = await server.inject({
      url: '/graphql',
      method: 'post',
      payload: { query: `mutation {
        createFirewallRule(
          enabled: true
          rule: "${firewallRule.rule}"
          description: "${firewallRule.description}"
        ) { id rule_str enabled } }`
      }
    });
    expect(res.statusCode).to.equal(200);
    expect(res.result.data.createFirewallRule.id).to.equal(firewallRule.id);
    expect(res.result.data.createFirewallRule.rule_str).to.equal(firewallRule.rule);
    expect(res.result.data.createFirewallRule.enabled).to.equal(firewallRule.enabled);
  });

  it('can update a firewall rule', async () => {
    StandIn.replaceOnce(CloudApi.prototype, 'fetch', () => {
      return firewallRule;
    });

    const server = await ServerHelper.getServer();
    const res = await server.inject({
      url: '/graphql',
      method: 'post',
      payload: { query: `mutation {
        updateFirewallRule(
          id: "${firewallRule.id}"
          enabled: true
          rule: "${firewallRule.rule}"
          description: "${firewallRule.description}"
        ) { id rule_str enabled } }`
      }
    });
    expect(res.statusCode).to.equal(200);
    expect(res.result.data.updateFirewallRule.id).to.equal(firewallRule.id);
    expect(res.result.data.updateFirewallRule.rule_str).to.equal(firewallRule.rule);
    expect(res.result.data.updateFirewallRule.enabled).to.equal(firewallRule.enabled);
  });

  it('can enable a firewall rule', async () => {
    StandIn.replaceOnce(CloudApi.prototype, 'fetch', () => {
      return firewallRule;
    });

    const server = await ServerHelper.getServer();
    const res = await server.inject({
      url: '/graphql',
      method: 'post',
      payload: { query: `mutation {
        enableFirewallRule(id: "${firewallRule.id}") { id rule_str enabled } }`
      }
    });
    expect(res.statusCode).to.equal(200);
    expect(res.result.data.enableFirewallRule.id).to.equal(firewallRule.id);
    expect(res.result.data.enableFirewallRule.rule_str).to.equal(firewallRule.rule);
    expect(res.result.data.enableFirewallRule.enabled).to.equal(true);
  });

  it('can disable a firewall rule', async () => {
    StandIn.replaceOnce(CloudApi.prototype, 'fetch', () => {
      const alteredFirewall = Object.assign({}, firewallRule, { enabled: false });
      return alteredFirewall;
    });

    const server = await ServerHelper.getServer();
    const res = await server.inject({
      url: '/graphql',
      method: 'post',
      payload: { query: `mutation {
        disableFirewallRule(id: "${firewallRule.id}") { id rule_str enabled } }`
      }
    });
    expect(res.statusCode).to.equal(200);
    expect(res.result.data.disableFirewallRule.id).to.equal(firewallRule.id);
    expect(res.result.data.disableFirewallRule.rule_str).to.equal(firewallRule.rule);
    expect(res.result.data.disableFirewallRule.enabled).to.equal(false);
  });

  it('can delete a firewall rule', async () => {
    StandIn.replace(CloudApi.prototype, 'fetch', () => {
      return firewallRule;
    }, { replaceAfter: 2 });

    const server = await ServerHelper.getServer();
    const res = await server.inject({
      url: '/graphql',
      method: 'post',
      payload: { query: `mutation {
        deleteFirewallRule(id: "${firewallRule.id}") { id rule_str enabled } }`
      }
    });
    expect(res.statusCode).to.equal(200);
    expect(res.result.data.deleteFirewallRule.id).to.equal(firewallRule.id);
    expect(res.result.data.deleteFirewallRule.rule_str).to.equal(firewallRule.rule);
    expect(res.result.data.deleteFirewallRule.enabled).to.equal(firewallRule.enabled);
  });

  it('can apply tagged rules for creating a machine', async () => {
    const fetch = TestDouble.func();
    const rule = Object.assign({}, firewallRule);
    rule.rule = 'FROM tag bacon TO tag flavor=smokey ALLOW udp port 8675';
    TestDouble.when(fetch('/fwrules')).thenResolve([rule]);
    const tags = [{ name: 'bacon' }, { name: 'flavor', value: 'smokey' }];
    const res = await FirewallRules.firewall_rules_create_machine(fetch, { tags });
    expect(res).to.exist();
    expect(res.length).to.equal(1);
    expect(res[0].rule_obj.action).to.equal('allow');
    const tag = res[0].rule_obj.from[0][1];
    expect(tag).to.equal('bacon');
  });

  it('can apply wildcard rules for creating a machine', async () => {
    const fetch = TestDouble.func();
    const rule = Object.assign({}, firewallRule);
    rule.rule = 'FROM any TO any ALLOW udp port 8675';
    TestDouble.when(fetch('/fwrules')).thenResolve([rule]);
    const res = await FirewallRules.firewall_rules_create_machine(fetch, { tags: []});
    expect(res).to.exist();
    expect(res.length).to.equal(1);
    expect(res[0].rule_obj.action).to.equal('allow');
    expect(res[0].rule_obj.isWildcard).to.equal(true);
  });
});
