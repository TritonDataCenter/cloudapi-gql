'use strict';


const Utils = require('../utils');
const Formatters = require('../formatters');

// eslint-disable-next-line camelcase
exports.firewall_rule = (fetch, { id }) => {
  return fetch(`/fwrules/${id}`);
};

// eslint-disable-next-line camelcase
exports.firewall_rules = async (fetch, { machine, id } = {}) => {
  if (id) {
    const rule = await exports.firewall_rule(fetch, { id });
    return [rule];
  }

  if (machine) {
    return fetch(`/machines/${machine}/fwrules`);
  }

  return fetch('/fwrules');
};

// TEMPORARY
// TODO: run in a worker
exports.firewall_rules_create_machine = async (fetch, { tags }) => {
  const machineTags = Utils.fromNameValues(tags);
  const res = await exports.firewall_rules(fetch);

  const rules = res.map(({ rule, ...rest }) => {
    return Object.assign(rest, {
      rule_str: rule,
      rule_obj: Formatters.FirewallRule.rule_obj({
        ...rest,
        rule
      })
    });
  });

  return rules.filter(({ rule_obj }) => {
    const { isWildcard, tags } = rule_obj;

    return isWildcard || tags.some(({ name, value }) => {
      return !value ?
        machineTags[name] !== undefined :
        machineTags[name] === value;
    });
  });
};


exports.createFirewallRule = (fetch, { enabled, rule, description }) => {
  const payload = {
    enabled,
    rule,
    description
  };

  return fetch('/fwrules', { method: 'post', payload });
};

exports.updateFirewallRule = (fetch, { id, enabled, rule, description }) => {
  const payload = {
    enabled,
    rule,
    description
  };

  return fetch(`/fwrules${id}`, { method: 'post', payload });
};

exports.enableFirewallRule = (fetch, { id }) => {
  return fetch(`/fwrules${id}/enable`, { method: 'post' });
};

exports.disableFirewallRule = (fetch, { id }) => {
  return fetch(`/fwrules${id}/disable`, { method: 'post' });
};

exports.deleteFirewallRule = async (fetch, { id }) => {
  const firewallRule = await exports.firewall_rule(fetch, { id });
  await fetch(`/fwrules${id}`, { method: 'delete' });

  return firewallRule;
};
