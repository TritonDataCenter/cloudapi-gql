'use strict';

const Firewalls = require('./firewalls');
const Metadata = require('./metadata');
const Nics = require('./nics');
const Snapshots = require('./snapshots');
const Tags = require('./tags');
const Utils = require('../../utils');


for (const dep of [Firewalls, Metadata, Nics, Snapshots, Tags]) {
  const keys = Object.keys(dep);
  for (const key of keys) {
    exports[key] = dep[key];
  }
}

exports.machine = (fetch, { id }) => {
  return fetch(`/machines/${id}`);
};

exports.machines = async (fetch, { id, brand = '', state = '', tags = [], ...args }) => {
  if (id) {
    const machine = await exports.machine(fetch, { id });
    return Utils.toPage({ payload: [machine] });
  }

  const query = {
    ...args,
    ...Utils.fromNameValues(tags, 'tag.')
  };

  if (brand) {
    brand = brand.toLowerCase();
    query.brand = brand;
  }

  if (state) {
    state = state.toLowerCase();
    query.state = state;
  }

  const { res: { headers } } = await fetch('/machines', {
    method: 'head',
    includeRes: true,
    query: {
      ...query,
      limit: null, // NOTE: no support for > 1000 instances
      offset: null
    }
  });

  const { res, payload } = await fetch('/machines', { query, includeRes: true });

  res.headers['x-resource-count'] = headers['x-resource-count'];
  return Utils.toPage({ payload, res, ...args });
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

exports.deleteMachine = async (fetch, { id }) => {
  const machine = await exports.machine(fetch, { id });
  await fetch(`/machines/${id}`, { method: 'delete' });
  return machine;
};
