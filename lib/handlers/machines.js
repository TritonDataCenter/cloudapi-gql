'use strict';

const Formatters = require('../formatters');
const Utils = require('../utils');


exports.machine = (fetch, { id }) => {
  return fetch(`/machines/${id}`);
};

exports.machines = async (fetch, { id, brand = '', state = '', tags = [], ...args}) => {
  if (id) {
    const machine = await exports.machine(fetch, { id });
    return [machine];
  }

  const query = {
    ...args,
    ...Utils.fromNameValues(tags, 'tag.')
  };

  if (brand) {
    brand = brand.toLowerCase();
  }

  if (state) {
    state = state.toLowerCase();
  }

  return fetch('/machines', { query });
};


exports.snapshot = (fetch, { machine, name }) => {
  return fetch(`/machines/${machine}/snapshots/${name}`);
};

exports.snapshots = async (fetch, { machine, name }) => {
  if (name !== undefined) {
    const snapshot = await exports.snapshot(fetch, { machine, name });
    return [snapshot];
  }

  return fetch(`/machines/${machine}/snapshots`);
};


exports.metadataValue = async (fetch, { machine, name }) => {
  const metadata = await fetch(`/machines/${machine}/metadata/${name}`);
  return Utils.toNameValues({ [name]: metadata }).shift();
};

exports.metadata = async (fetch, { machine, name }) => {
  if (name !== undefined) {
    const metadata = await exports.metadataValue(fetch, { machine, name });
    return [metadata];
  }

  const metadatas = await fetch(`/machines/${machine}/metadata`);
  return Utils.toNameValues(metadatas);
};


exports.tag = async (fetch, { machine, name }) => {
  const tag = await fetch(`/machines/${machine}/tags/${name}`);
  return Utils.toNameValues({ [name]: tag }).shift();
};

exports.tags = async (fetch, { machine, name }) => {
  if (name !== undefined) {
    const tag = await exports.tag(fetch, { machine, name });
    return [tag];
  }

  const tags = await fetch(`/machines/${machine}/tags`);
  return Utils.toNameValues(tags);
};


exports.actions = (fetch, { machine }) => {
  return fetch(`/machines/${machine}/audit`);
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


exports.stopMachine = async (fetch, { id }) => {
  const query = {
    action: 'stop'
  };

  await fetch(`/machines/${id}`, { method: 'post', query });
  return exports.machine(fetch, { id });
};

exports.startMachine = async (fetch, { id }) => {
  const query = {
    action: 'start'
  };

  await fetch(`/machines/${id}`, { method: 'post', query });
  return exports.machine(fetch, { id });
};


exports.rebootMachine = async (fetch, { id }) => {
  const query = {
    action: 'reboot'
  };

  await fetch(`/machines/${id}`, { method: 'post', query });
  return exports.machine(fetch, { id });
};


exports.resizeMachine = async (fetch, payload) => {
  const { id } = payload;
  const query = {
    action: 'reboot',
    'package': payload['package']
  };

  await fetch(`/machines/${id}`, { method: 'post', query });
  return exports.machine(fetch, { id });
};

exports.enableMachineFirewall = async (fetch, { id }) => {
  const query = {
    action: 'enable_firewall'
  };

  await fetch(`/machines/${id}`, { method: 'post', query });
  return exports.machine(fetch, { id });
};

exports.disableMachineFirewall = async (fetch, { id }) => {
  const query = {
    action: 'disable_firewall'
  };

  await fetch(`/machines/${id}`, { method: 'post', query });
  return exports.machine(fetch, { id });
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


exports.createMachineSnapshot = (fetch, { id, name }) => {
  const payload = { name };

  return fetch(`/machines/${id}/snapshots`, { method: 'post', payload });
};

exports.startMachineFromSnapshot = async (fetch, { id, snapshot }) => {
  await fetch(`/machines/${id}/snapshots/${snapshot}`, { method: 'post' });
  return exports.machine(fetch, { id });
};

exports.deleteMachineSnapshot = async (fetch, { id, snapshot }) => {
  await fetch(`/machines/${id}/snapshots/${snapshot}`, { method: 'delete' });
  return exports.machine(fetch, { id });
};

exports.createMachine = async (fetch, { name, image, networks, affinity = [], metadata, tags, firewall_enabled, ...args }) => {
  const affinityRuleTypes = {
    MUST_EQUAL: '==',
    MUST_NOT_EQUAL: '==~',
    SHOULD_EQUAL: '!=',
    SHOULD_NOT_EQUAL: '!=~'
  };

  const payload = {
    name,
    'package': args.package,
    image,
    networks,
    affinity: affinity.map(({ key, value, type }) => { return `${key}${affinityRuleTypes[type]}${value}`; }),
    ...Utils.fromNameValues(tags, 'tag.'),
    ...Utils.fromNameValues(metadata, 'metadata.'),
    firewall_enabled
  };

  const { id } = await fetch('/machines', { method: 'post', payload });
  return exports.machine(fetch, { id });
};

exports.updateMachineMetadata = async (fetch, { id, metadata }) => {
  const payload = Utils.fromNameValues(metadata);

  await fetch(`/machines/${id}/metadata`, { method: 'post', payload });
  return exports.machine(fetch, { id });
};

exports.deleteMachineMetadata = async (fetch, { id, name }) => {
  await fetch(`/machines/${id}/metadata/${encodeURIComponent(name)}`, { method: 'delete' });
  return exports.machine(fetch, { id });
};

exports.addMachineTags = async (fetch, { id, tags }) => {
  const payload = Utils.fromNameValues(tags);

  await fetch(`/machines/${id}/tags`, { method: 'post', payload });
  return exports.machine(fetch, { id });
};

exports.replaceMachineTags = async (fetch, { id, tags }) => {
  const payload = Utils.fromNameValues(tags);

  await fetch(`/machines/${id}/tags`, { method: 'put', payload });
  return exports.machine(fetch, { id });
};

exports.deleteMachineTag = async (fetch, { id, name }) => {
  await fetch(`/machines/${id}/tags/${encodeURIComponent(name)}`, { method: 'delete' });
  return exports.machine(fetch, { id });
};

exports.deleteMachineTags = async (fetch, { id }) => {
  await fetch(`/machines/${id}/tags`, { method: 'delete' });
  return exports.machine(fetch, { id });
};

exports.deleteMachine = async (fetch, { id }) => {
  const machine = await exports.machine(fetch, { id });
  await fetch(`/machines/${id}`, { method: 'delete' });
  return machine;
};


exports.nic = (fetch, { machine, mac }) => {
  return fetch(`/machines/${machine}/nics/${mac}`);
};

exports.nics = async (fetch, { machine, mac }) => {
  if (mac) {
    const nic = await exports.nic(fetch, { machine, mac });
    return [nic];
  }

  return fetch(`/machines/${machine}/nics`);
};
