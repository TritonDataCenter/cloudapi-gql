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


describe('firewallRules', () => {
  afterEach(() => {
    StandIn.restoreAll();
  });

  const firewallRule = {
    id: '38de17c4-39e8-48c7-a168-0f58083de860',
    rule: 'FROM vm 3d51f2d5-46f2-4da5-bb04-3238f2f64768 TO subnet 10.99.99.0/24 BLOCK tcp PORT 25',
    enabled: true,
    description: 'test'
  };

  it('can list firewall rules', async () => {
    const server = new Hapi.Server();
    StandIn.replaceOnce(CloudApi.prototype, 'fetch', () => {
      return [firewallRule];
    });

    await server.register({ plugin: CloudApiGql, options: { keyPath: Path.join(__dirname, 'test.key') } });
    await server.initialize();
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
    const server = new Hapi.Server();
    StandIn.replaceOnce(CloudApi.prototype, 'fetch', () => {
      return firewallRule;
    });

    await server.register({ plugin: CloudApiGql, options: { keyPath: Path.join(__dirname, 'test.key') } });
    await server.initialize();
    const res = await server.inject({
      url: '/graphql',
      method: 'post',
      payload: { query: `query { firewall_rules(id: "${firewallRule.id}") { id rule_str enabled } }` }
    });
    expect(res.statusCode).to.equal(200);
    expect(res.result.data.firewall_rules[0].id).to.equal(firewallRule.id);
    expect(res.result.data.firewall_rules[0].rule_str).to.equal(firewallRule.rule);
    expect(res.result.data.firewall_rules[0].enabled).to.equal(firewallRule.enabled);
  });

  it('can create a firewall rule', async () => {
    const server = new Hapi.Server();
    StandIn.replaceOnce(CloudApi.prototype, 'fetch', () => {
      return firewallRule;
    });

    await server.register({ plugin: CloudApiGql, options: { keyPath: Path.join(__dirname, 'test.key') } });
    await server.initialize();
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
    const server = new Hapi.Server();
    StandIn.replaceOnce(CloudApi.prototype, 'fetch', () => {
      return firewallRule;
    });

    await server.register({ plugin: CloudApiGql, options: { keyPath: Path.join(__dirname, 'test.key') } });
    await server.initialize();
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
    const server = new Hapi.Server();
    StandIn.replaceOnce(CloudApi.prototype, 'fetch', () => {
      return firewallRule;
    });

    await server.register({ plugin: CloudApiGql, options: { keyPath: Path.join(__dirname, 'test.key') } });
    await server.initialize();
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
    const server = new Hapi.Server();
    StandIn.replaceOnce(CloudApi.prototype, 'fetch', () => {
      const alteredFirewall = Object.assign({}, firewallRule, { enabled: false });
      return alteredFirewall;
    });

    await server.register({ plugin: CloudApiGql, options: { keyPath: Path.join(__dirname, 'test.key') } });
    await server.initialize();
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
    const server = new Hapi.Server();
    StandIn.replace(CloudApi.prototype, 'fetch', () => {
      return firewallRule;
    }, { replaceAfter: 2 });

    await server.register({ plugin: CloudApiGql, options: { keyPath: Path.join(__dirname, 'test.key') } });
    await server.initialize();
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
});
