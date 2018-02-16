'use strict';

const Firewalls = require('./firewalls');
const Nics = require('./nics');
const Snapshots = require('./snapshots');
const Tags = require('./tags');
const Utils = require('../../utils');


for (const dep of [Firewalls, Nics, Snapshots, Tags]) {
  const keys = Object.keys(dep);
  for (const key of keys) {
    exports[key] = dep[key];
  }
}

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

exports.actions = (fetch, { machine }) => {
  return fetch(`/machines/${machine}/audit`);
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

exports.renameMachine = async (fetch, { id, name }) => {
  const query = {
    action: 'rename',
    name
  };

  await fetch(`/machines/${id}`, { method: 'post', query });
  return exports.machine(fetch, { id });
};

const affinityRuleTypes = {
  MUST_EQUAL: '==',
  MUST_NOT_EQUAL: '==~',
  SHOULD_EQUAL: '!=',
  SHOULD_NOT_EQUAL: '!=~'
};

const formatAffinity = ({ key, value, type }) => {
  return `${key}${affinityRuleTypes[type]}${value}`;
};

exports.createMachine = async (fetch, { name, image, networks, affinity = [], metadata, tags, firewall_enabled, ...args }) => {
  const payload = {
    name,
    'package': args.package,
    image,
    networks,
    affinity: affinity.map(formatAffinity),
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

exports.deleteAllMachineMetadata = async (fetch, { id }) => {
  await fetch(`/machines/${id}/metadata`, { method: 'delete' });
  return exports.machine(fetch, { id });
};

exports.deleteMachine = async (fetch, { id }) => {
  const machine = await exports.machine(fetch, { id });
  await fetch(`/machines/${id}`, { method: 'delete' });
  return machine;
};
