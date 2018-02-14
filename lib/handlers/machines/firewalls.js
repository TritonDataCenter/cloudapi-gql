'use strict';

const Formatters = require('../../formatters');
const Utils = require('../../utils');


exports.enableMachineFirewall = async (fetch, { id }) => {
  const query = {
    action: 'enable_firewall'
  };

  await fetch(`/machines/${id}`, { method: 'post', query });
  return fetch(`/machines/${id}`);
};

exports.disableMachineFirewall = async (fetch, { id }) => {
  const query = {
    action: 'disable_firewall'
  };

  await fetch(`/machines/${id}`, { method: 'post', query });
  return fetch(`/machines/${id}`);
};

// eslint-disable-next-line camelcase
exports.firewall_rule = (fetch, { id }) => {
  return fetch(`/fwrules/${id}`);
};

// eslint-disable-next-line camelcase
exports.firewall_rules = async (fetch, { machine, id }) => {
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
    return isWildcard || tags.some((tag) => { return machineTags[tag] !== undefined; });
  });
};
