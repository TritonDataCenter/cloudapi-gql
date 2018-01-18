'use strict';

const ForceArray = require('force-array');
const constantCase = require('constant-case');
const Hasha = require('hasha');
const Map = require('apr-map');
const FWRule = require('fwrule');
const RandomInt = require('random-int');
const Sentiment = require('sentiment');

const CloudApi = require('./cloudapi');
const Adjectives = require('./adjectives.json');
const Names = require('./names.json');

const internals = {};

module.exports = internals.resolvers = {
  Query: {
    rndName: (root, args, request) => {
      const name = Names[RandomInt(0, Names.length -1)];
      const adjective = Adjectives[RandomInt(0, Adjectives.length -1)];

      const str = `${adjective}-${name}`;

      if (Sentiment(str.split(/\-/).join(' ')).score < 0) {
        return internals.resolvers.Query.rndName(root, args, request);
      }

      return str;
    },
    account: (root, args = {}, request) => {
      return CloudApi('', {}, request);
    },

    keys: async (root, { name }, request) => {
      if (name) {
        const key = await internals.resolvers.Query.key(root, { name }, request);
        return [key];
      }

      return CloudApi('/keys', {}, request);
    },

    key: (root, { name }, request) => {
      return CloudApi(`/keys/${name}`, {}, request);
    },

    users: async (root, { id }, request) => {
      if (id) {
        const user = await internals.resolvers.Query.user(root, { id }, request);
        return [user];
      }

      return CloudApi(`/users`, {}, request);
    },

    user: (root, { id }, request) => {
      return CloudApi(`/users/${id}`, {}, request);
    },

    roles: async (root, { id, name }, request) => {
      if (id || name) {
        const role = await internals.resolvers.Query.role(root, { id, name }, request);
        return [role];
      }

      return CloudApi(`/roles`, {}, request);
    },

    role: (root, { id, name }, request) => {
      return CloudApi(`/roles/${id || name}`, {}, request);
    },

    policies: async (root, { id }, request) => {
      if (id) {
        const policy = await internals.resolvers.Query.policy(root, { id }, request);
        return [policy];
      }

      return CloudApi(`/policies`, {}, request);
    },

    policy: (root, { id }, request) => {
      return CloudApi(`/policies/${id}`, {}, request);
    },

    config: async (root, args, request) => {
      const config = await CloudApi('/config', {}, request);
      return internals.toNameValues(config);
    },

    datacenters: async (root, args = {}, request) => {
      const datacenters = await CloudApi('/datacenters', {}, request);

      return Object.keys(datacenters).map((name) => {
        return {
          name,
          url: datacenters[name]
        };
      });
    },

    services: async (root, args, request) => {
      const services = await CloudApi('/services', {}, request);
      return internals.toNameValues(services);
    },

    images: async (root, { id, type = '', os = '', state = 'ACTIVE', ...args }, request) => {
      if (id) {
        const image = await internals.resolvers.Query.policy(root, { id }, request);
        return [image];
      }

      const query = {
        ...args,
        type: type.toLowerCase(),
        os: os.toLowerCase(),
        state: state.toLowerCase()
      };

      return CloudApi('/images', { query }, request);
    },

    image: async (root = {}, { id }, request) => {
      const { brand } = root;

      try {
        return await CloudApi(`/images/${id}`, {}, request);
      } catch (ex) {
        request.log(['error', 'image'], ex);

        if (brand === 'lx') {
          return {};
        }

        throw ex;
      }
    },

    packages: async (root, { id, name, ...args }, request) => {
      if (id || name) {
        const pkg = await internals.resolvers.Query.package(root, { id, name }, request);
        return [pkg];
      }

      return CloudApi('/packages', { query: args }, request);
    },

    package: (root, { id, name}, request) => {
      return CloudApi(`/packages/${id || name}`, {}, request);
    },

    machines: async (root, { id, brand = '', state = '', tags = [], ...args}, request, queryAST) => {
      if (id) {
        const machine = await internals.resolvers.Query.machine(root, { id }, request);
        return [machine];
      }

      const query = {
        ...args,
        ...internals.fromNameValues(tags, 'tag.')
      };

      if (brand) {
        brand = brand.toLowerCase();
      }

      if (state) {
        state = state.toLowerCase();
      }

      const machinesList = await CloudApi('/machines', { query }, request);
      const field = ForceArray(queryAST.fieldNodes)
        .filter(({ name }) => { return name.value === 'machines'; })
        .shift();

      if (!field) {
        return machinesList;
      }

      const prop = (field && field.selectionSet && field.selectionSet.selections || [])
        .filter(({ name }) => { return name.value === 'dns_names'; })
        .shift();

      if (!prop) {
        return machinesList;
      }

      return Map(machinesList, ({ id }) => internals.resolvers.Query.machine(root, { id }, request));
    },

    machine: (root, { id }, request) => {
      return CloudApi(`/machines/${id}`, {}, request);
    },

    snapshots: async (root, { name, machine }, request) => {
      if (name) {
        const snapshot = await internals.resolvers.Query.snapshot(root, { machine, name }, request);
        return [snapshot];
      }

      return CloudApi(`/machines/${machine}/snapshots`, {}, request);
    },

    snapshot: (root, { name, machine }, request) => {
      return CloudApi(`/machines/${machine}/snapshots/${name}`, {}, request);
    },

    metadata: async (root, { machine, name, credentials }, request) => {
      if (name) {
        const metadata = await internals.resolvers.Query.metadataValue(root, { machine, name }, request);
        return [metadata];
      }

      const metadatas = await CloudApi(`/machines/${machine}/metadata`, {}, request);
      return internals.toNameValues(metadatas);
    },

    metadataValue: async (root, { machine, name}, request) => {
      const metadata = await CloudApi(`/machines/${machine}/metadata/${name}`, {}, request);
      return internals.toNameValues({ [name]: metadata }).shift();
    },

    tags: async (root, { machine, name }, request) => {
      if (name) {
        const tag = await internals.resolvers.Query.tag(root, { machine, name }, request);
        return [tag];
      }

      const tags = await CloudApi(`/machines/${machine}/tags`, {}, request);
      return internals.toNameValues(tags);
    },

    tag: async (root, { machine, name }, request) => {
      const tag = await CloudApi(`/machines/${machine}/tags/${name}`, {}, request);
      return internals.toNameValues({ [name]: tag }).shift();
    },

    actions: (root, { machine }, request) => {
      return CloudApi(`/machines/${machine}/audit`, {}, request);
    },

    // eslint-disable-next-line camelcase
    firewall_rules: async (root, { machine, id }, request) => {
      if (id) {
        const rule = await internals.resolvers.Query.firewall_rule(root, { id }, request);
        return [rule];
      }

      if (machine) {
        return CloudApi(`/machines/${machine}/fwrules`, {}, request);
      }

      return CloudApi('/fwrules', {}, request);
    },

    // eslint-disable-next-line camelcase
    firewall_rule: (root, { id }, request) => {
      return CloudApi(`/fwrules/${id}`, {}, request);
    },

    // TEMPORARY
    // TODO: run in a worker
    firewall_rules_create_machine: async (root, args, request) => {
      const tags = internals.fromNameValues(args.tags);
      const res = await internals.resolvers.Query.firewall_rules(root, {}, request);

      const rules = res.map(({ rule, ...rest }) => {
        return Object.assign(rest, {
          rule_str: rule,
          rule_obj: FWRule.parse(rule)
        });
      });

      const defaultRules = rules.filter(({ enabled, rule_obj = {} }) => {
        return (
          ForceArray(rule_obj.from).some(frm => frm[0] === 'wildcard') &&
          ForceArray(rule_obj.to).some(to => to[0] === 'wildcard')
        );
      });

      const filterTagRulePartial = partial => {
        return partial
          .map(partial => ForceArray(partial))
          .filter(partial => partial[0] === 'tag')
          .filter(partial => {
            const tag = ForceArray(partial[1]);
            const foundTagValue = tags[tag[0]];

            if (!foundTagValue) {
              return false;
            }

            if (tag.length === 1) {
              return true;
            }

            return foundTagValue === tag[1];
          });
      };

      const tagRules = rules
        .filter(({ enabled, rule_obj = {} }) => {
          const _from = ForceArray(rule_obj.from);
          const _to = ForceArray(rule_obj.to);

          const fromHas = filterTagRulePartial(_from).length;
          const toHas = filterTagRulePartial(_to).length;

          return Boolean(fromHas) || Boolean(toHas);
        })
        .map(rule => {
          return Object.assign(rule, { tag: true });
        });

      return defaultRules.concat(tagRules);
    },

    vlans: async (root, { id }, request) => {
      if (id) {
        const vlan = await internals.resolvers.Query.vlan(root, { id }, request);
        return [vlan];
      }

      return CloudApi('/fabrics/default/vlans', {}, request);
    },

    vlan: (root, { id }, request) => {
      return CloudApi(`/fabrics/default/vlans/${id}`, {}, request);
    },

    networks: async (root, { id, vlan }, request) => {
      if (id) {
        const network = await internals.resolvers.Query.network(root, { id }, request);
        return [network];
      }

      if (vlan) {
        return CloudApi(`/fabrics/default/vlans/${vlan}/networks`, {}, request);
      }

      return CloudApi('/networks', {}, request);
    },

    network: (root, { id, vlan }, request) => {
      return CloudApi(`/networks/${id}`, {}, request);
    },

    nics: async (root, { machine, mac }, request) => {
      if (mac) {
        const nic = await internals.resolvers.Query.nic(root, { machine, mac }, request);
        return [nic];
      }

      return CloudApi(`/machines/${machine}/nics`, {}, request);
    },

    nic: (root, { machine, mac }, request) => {
      return CloudApi(`/machines/${machine}/nics/${mac}`, {}, request);
    }
  },

  Mutation: {
    updateAccount: (root, payload, request) => {
      return CloudApi('/', { method: 'post', payload }, request);
    },

    createKey: (root, { user, name, key }, request) => {
      const path = user ? `/users/${user}/keys` : '/keys';
      const payload = { name, key };

      return CloudApi(path, { method: 'post', payload: { name, key } }, request);
    },

    deleteKey: (root, { user, name, fingerprint }, request) => {
      const resource = name || fingerprint;
      const path = user ? `/users/${user}/keys/${resource}` : `/keys/${resource}`;

      return CloudApi(path, { method: 'delete' }, request);
    },


    stopMachine: async (root, args, request) => {
      const { id } = args;

      const query = {
        action: 'stop'
      };

      await CloudApi(`/machines/${id}`, { method: 'post', query }, request);
      return internals.resolvers.Query.machine(root, args, request);
    },

    startMachine: async (root, args, request) => {
      const { id } = args;

      const query = {
        action: 'start'
      };

      await CloudApi(`/machines/${id}`, { method: 'post', query }, request);
      return internals.resolvers.Query.machine(root, args, request);
    },

    rebootMachine: async (root, args, request) => {
      const { id } = args;

      const query = {
        action: 'reboot'
      };

      await CloudApi(`/machines/${id}`, { method: 'post', query }, request);
      return internals.resolvers.Query.machine(root, args, request);
    },

    resizeMachine: async (root, args, request) => {
      const { id } = args;

      const query = {
        action: 'reboot',
        'package': args['package']
      };

      await CloudApi(`/machines/${id}`, { method: 'post', query }, request);
      return internals.resolvers.Query.machine(root, args, request);
    },

    enableMachineFirewall: async (root, args, request) => {
      const { id } = args;

      const query = {
        action: 'enable_firewall'
      };

      await CloudApi(`/machines/${id}`, { method: 'post', query }, request);
      return internals.resolvers.Query.machine(root, args, request);
    },

    disableMachineFirewall: async (root, args, request) => {
      const { id } = args;

      const query = {
        action: 'disable_firewall'
      };

      await CloudApi(`/machines/${id}`, { method: 'post', query }, request);
      return internals.resolvers.Query.machine(root, args, request);
    },

    createMachineSnapshot: async (root, { id, name }, request) => {
      const payload = {
        name
      };

      return CloudApi(`/machines/${id}/snapshots`, { method: 'post', payload }, request);
    },

    startMachineFromSnapshot: async (root, { id, snapshot: name }, request) => {
      await CloudApi(`/machines/${id}/snapshots/${name}`, { method: 'post' }, request);
      return internals.resolvers.Query.machine(root, { id }, request);
    },

    deleteMachineSnapshot: async (root, { id, snapshot: name }, request) => {
      await CloudApi(`/machines/${id}/snapshots/${name}`, { method: 'delete' }, request);
      return internals.resolvers.Query.machine(root, { id }, request);
    },

    createMachine: async (root, { name, image, networks, affinity, metadata, tags, firewall_enabled, ...args }, request) => {
      const AffinityRuleTypes = {
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
        affinity: affinity.map(({ key, value, type }) => `${key}${AffinityRuleTypes[type]}${value}`),
        ...internals.fromNameValues(tags, 'tag.'),
        ...internals.fromNameValues(metadata, 'tag.'),
        firewall_enabled
      };

      const { id } = await CloudApi(`/machines`, { method: 'post', payload }, request);
      return internals.resolvers.Query.machine(root, { id }, request);
    },

    updateMachineMetadata: async (root, { id, metadata }, request) => {
      const payload = internals.fromNameValues(metadata)

      await CloudApi(`/machines/${id}/metadata`, { method: 'post', payload }, request);
      return internals.resolvers.Query.machine(root, { id }, request);
    },

    deleteMachineMetadata: async (root, { id, name }, request) => {
      await CloudApi(`/machines/${id}/metadata/${encodeURIComponent(name)}`, { method: 'delete' }, request);
      return internals.resolvers.Query.machine(root, { id }, request);
    },

    addMachineTags: async (root, { id, tags }, request) => {
      const payload = internals.fromNameValues(tags)

      await CloudApi(`/machines/${id}/tags`, { method: 'post', payload }, request);
      return internals.resolvers.Query.machine(root, { id }, request);
    },

    replaceMachineTags: async (root, { id, tags }, request) => {
      const payload = internals.fromNameValues(tags)

      await CloudApi(`/machines/${id}/tags`, { method: 'put', payload }, request);
      return internals.resolvers.Query.machine(root, { id }, request);
    },

    deleteMachineTag: async (root, { id, name: tag }, request) => {
      await CloudApi(`/machines/${id}/tags/${encodeURIComponent(name)}`, { method: 'delete' }, request);
      return internals.resolvers.Query.machine(root, { id }, request);
    },

    deleteMachineTags: async (root, { id }, request) => {
      await CloudApi(`/machines/${id}/tags`, { method: 'delete' }, request);
      return internals.resolvers.Query.machine(root, { id }, request);
    },

    deleteMachine: async (root, { id }, request) => {
      const machine = await internals.resolvers.Query.machine(root, { id }, request);
      await CloudApi(`/machines/${id}`, { method: 'delete' }, request);
      return machine;
    }
  }
};

internals.resolvers = Object.assign(internals.resolvers, {
  User: {
    keys: internals.resolvers.Query.keys
  },
  Machine: {
    brand: ({ brand }) => { return (brand ? brand.toUpperCase() : brand); },

    state: ({ state }) => { return (state ? state.toUpperCase() : state); },

    image: (root, args, request) => {
      const { image: id } = root;
      return internals.resolvers.Query.image(root, { id }, request);
    },

    // eslint-disable-next-line camelcase
    primary_ip: ({ primaryIp }) => { return primaryIp; },

    tags: (root, { name }, request) => {
      const { id: machine } = root;
      return internals.resolvers.Query.tags(root, { machine, name }, request);
    },

    metadata: (root, { name }, request) => {
      const { id: machine } = root;
      return internals.resolvers.Query.metadata(root, { machine, name }, request);
    },

    networks: (root, args, request) => {
      const { networks } = root;
      return Promise.all(
        networks.map((id) => { return internals.resolvers.Query.network(root, { id }, request); })
      );
    },

    // eslint-disable-next-line camelcase
    package: (root, args, request) => {
      return internals.resolvers.Query.package(root, { name: root.package }, request);
    },

    snapshots: (root, { name }, request) => {
      const { id: machine } = root;
      return internals.resolvers.Query.snapshots(root, { machine, name }, request);
    },

    // eslint-disable-next-line camelcase
    firewall_rules: (root, { id }, request) => {
      const { id: machine } = root;
      return internals.resolvers.Query.firewall_rules(root, { machine, id }, request);
    },

    actions: (root, args, request) => {
      const { id: machine } = root;
      return internals.resolvers.Query.actions(root, { machine }, request);
    }
  },
  Image: {
    os: ({ os }) => { return (os ? os.toUpperCase() : os); },

    state: ({ state }) => { return (state ? state.toUpperCase() : state); },

    type: ({ type }) => { return (type ? constantCase(type) : type); }
  },
  Action: {
    name: ({ action }) => { return action; },

    parameters: ({ parameters }) => { return internals.toNameValues(parameters); }
  },
  Caller: {
    type: ({ type }) => { return (type ? type.toUpperCase() : type); },

    // eslint-disable-next-line camelcase
    key_id: ({ keyId }) => { return keyId; }
  },
  FirewallRule: {
    machines: ({ id }, args, request) => {
      return CloudApi(`/fwrules/${id}/machines`, {}, request);
    },
    rule_str: ({ rule }, args, request) => rule,
    rule_obj: ({ rule }, args, request) => FWRule.parse(rule)
  },
  Snapshot: {
    state: ({ state }) => { return (state ? state.toUpperCase() : state); },
    id: ({ name }) => { return Hasha(name) }
  },
  ImageError: {
    code: ({ code }) => { return (code ? code.toUpperCase() : code); }
  },
  ImageFile: {
    compression: ({ compression }) => { return (compression ? compression.toUpperCase() : compression); }
  }
});

internals.toNameValues = (obj) => {
  if (!obj) {
    return [];
  }

  return Object.keys(obj).map((name) => {
    const value = obj[name];
    return {
      id: Hasha(JSON.stringify({ name: name, value })),
      name,
      value
    };
  });
};

internals.fromNameValues = (nameValues, prefix = '') => {
  return ForceArray(nameValues).reduce((accumulator, { name, value }) => {
    return Object.assign(accumulator, {
      [prefix + name]: name === 'triton.cns.disable' ? JSON.parse(value) : value
    });
  }, {});
};
