'use strict';

const ForceArray = require('force-array');
const Hasha = require('hasha');
const CloudApi = require('./cloudapi');


const internals = {};

module.exports = internals.resolvers = {
  Query: {
    account: (root, args = {}, request) => {
      return CloudApi('getAccount', args, request);
    },

    keys: async (root, { name }, request) => {
      const options = {
        path: '/keys'
      };

      if (name) {
        options.path += `/${name}`;

        const key = await CloudApi('fetch', options, request);
        return [key];
      }

      return CloudApi('fetch', options, request);
    },

    key: (root, { name }, request) => {
      const options = {
        path: `/keys/${name}`
      };

      return CloudApi('fetch', options, request);
    },

    users: async (root, args = {}, request) => {
      if (args.id) {
        const user = await CloudApi('getUser', args, request);
        return [user];
      }

      return CloudApi('listUsers', args, request);
    },

    user: (root, args = {}, request) => {
      return CloudApi('getUser', args, request);
    },

    roles: async (root, { id, name }, request) => {
      if (id || name) {
        const options = {
          path: `/roles/${id || name}`
        };

        const role = await CloudApi('fetch', options, request);
        return [role];
      }

      return CloudApi('listRoles', {}, request);
    },

    role: (root, { id, name }, request) => {
      const options = {
        path: `/roles/${id || name}`
      };

      return CloudApi('fetch', options, request);
    },

    policies: async (root, args = {}, request) => {
      if (args.id) {
        const policy = await CloudApi('getPolicy', args, request);
        return [policy];
      }

      return CloudApi('listPolicies', args, request);
    },

    policy: (root, args = {}, request) => {
      return CloudApi('getPolicy', args, request);
    },

    config: async (root, args, request) => {
      const options = {
        path: '/config'
      };

      const config = await CloudApi('fetch', options, request);
      return internals.toNameValues(config);
    },

    datacenters: async (root, args = {}, request) => {
      const datacenters = await CloudApi('listDatacenters', args, request);

      return Object.keys(datacenters).map((name) => {
        return {
          name,
          url: datacenters[name]
        };
      });
    },

    services: async (root, args, request) => {
      const services = await CloudApi('listServices', args, request);
      return internals.toNameValues(services);
    },

    images: async (root, args = {}, request) => {
      if (args.id) {
        const image = await CloudApi('getImage', args.id, request);
        return [image];
      }

      args.type = args.type && args.type.toLowerCase();
      args.os = args.os && args.os.toLowerCase();
      args.state = args.state && args.state.toLowerCase();

      return CloudApi('listImages', args, request);
    },

    image: async (root = {}, { id }, request) => {
      const { brand } = root;

      try {
        return await CloudApi('fetch', { path: `/images/${id}` }, request);
      } catch (ex) {
        request.log(['error', 'image'], ex);
        if (brand === 'lx') {
          return {};
        }

        throw ex;
      }
    },

    packages: async (root, args = {}, request) => {
      if (args.id) {
        const options = {
          path: `/packages/${args.id || args.name}`,
          default: {}
        };
        const pkg = await CloudApi('fetch', options, request);
        return [pkg];
      }

      return CloudApi('listPackages', args, request);
    },

    package: (root, args = {}, request) => {
      const options = {
        path: `/packages/${args.id || args.name}`,
        default: {}
      };

      return CloudApi('fetch', options, request);
    },

    machines: async (root, args = {}, request, queryAST) => {
      if (args.id) {
        const machine = await CloudApi('getMachine', { id: args.id }, request);
        return [machine];
      }

      args.brand = args.brand && args.brand.toLowerCase();
      args.state = args.state && args.state.toLowerCase();
      args.tags = internals.fromNameValues(args.tags);

      const machinesList = await CloudApi('listMachines', args, request);
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

      const machines = [];
      for (const machine of machinesList) {
        machines.push(await CloudApi('getMachine', { id: machine.id }, request));
      }

      return machines;
    },

    machine: (root, args, request) => {
      return CloudApi('getMachine', args, request);
    },

    snapshots: async (root, { name, machine }, request) => {
      if (name) {
        const snapshot = await internals.resolvers.Query.snapshot(root, { machine, name }, request);
        return [snapshot];
      }

      return CloudApi('listMachineSnapshots', { id: machine }, request);
    },

    snapshot: (root, { name, machine }, request) => {
      return CloudApi('getMachineSnapshot', { id: machine, name }, request);
    },

    metadata: async (root, args = {}, request) => {
      args.key = args.name;
      args.id = args.machine;

      if (args.key) {
        const options = {
          path: `/machines/${args.id}/metadata/${args.key}`,
          default: []
        };
        const metadata = await CloudApi('fetch', options, request);
        return internals.toNameValues({ [args.name]: metadata });
      }

      const options = {
        path: `/machines/${args.id}/metadata`
      };

      const metadatas = await CloudApi('fetch', options, request);
      return internals.toNameValues(metadatas);
    },

    metadataValue: async (root, args = {}, request) => {
      const options = {
        path: `/machines/${args.machine}/metadata/${args.name}`,
        default: []
      };
      const metadata = await CloudApi('fetch', options, request);
      return internals.toNameValues({ [args.name]: metadata }).shift();
    },

    tags: async (root, { machine, name }, request) => {
      if (name) {
        const tag = await CloudApi('getMachineTag', { id: machine, tag: name }, request);
        return internals.toNameValues({ [name]: tag });
      }

      const tags = await CloudApi('listMachineTags', { id: machine }, request);
      return internals.toNameValues(tags);
    },

    tag: async (root, { machine, name }, request) => {
      const tag = await CloudApi('getMachineTag', { id: machine, tag: name }, request);
      return internals.toNameValues({ [name]: tag }).shift();
    },

    actions: (root, { machine }, request) => {
      return CloudApi('machineAudit', machine, request);
    },

    // eslint-disable-next-line camelcase
    firewall_rules: async (root, args, request) => {
      const { machine, id } = args;

      if (id) {
        const rule = await CloudApi('getFirewallRule', id, request);
        return [rule];
      }

      if (machine) {
        return CloudApi('listMachineFirewallRules', { id: machine }, request);
      }

      return CloudApi('listFirewallRules', args, request);
    },

    // eslint-disable-next-line camelcase
    firewall_rule: (root, { id }, request) => {
      return CloudApi('getFirewallRule', id, request);
    },

    vlans: (root, { id }, request) => {
      const options = {
        path: '/fabrics/default/vlans'
      };

      if (id) {
        options.path += `/${id}`;
      }

      return CloudApi('fetch', options, request);
    },

    vlan: (root, { id }, request) => {
      const options = {
        path: `/fabrics/default/vlans/${id}`
      };

      return CloudApi('fetch', options, request);
    },

    networks: (root, args = {}, request) => {
      if (args.id) {
        return CloudApi('getNetwork', args.id, request);
      }

      return CloudApi('listNetworks', args, request);
    },

    network: (root, { id }, request) => {
      return CloudApi('getNetwork', id, request);
    },

    nics: (root, args = {}, request) => {
      if (args.mac) {
        return CloudApi('getNic', args, request);
      }

      return CloudApi('listNics', args, request);
    }
  },

  Mutation: {
    updateAccount: (root, args, request) => {
      return CloudApi('updateAccount', args, request);
    },

    createKey: (root, { name, key }, request) => {
      const options = {
        path: '/keys/',
        method: 'post',
        payload: { name, key }
      };

      return CloudApi('fetch', options, request);
    },

    deleteKey: (root, { name }, request) => {
      const options = {
        path: `/keys/${name}`,
        method: 'delete'
      };

      return CloudApi('fetch', options, request);
    },

    stopMachine: async (root, { id }, request) => {
      await CloudApi('stopMachine', id, request);
      return internals.resolvers.Query.machine(root, { id }, request);
    },

    startMachine: async (root, { id }, request) => {
      await CloudApi('startMachine', id, request);
      return internals.resolvers.Query.machine(root, { id }, request);
    },

    rebootMachine: async (root, { id }, request) => {
      await CloudApi('rebootMachine', id, request);
      return internals.resolvers.Query.machine(root, { id }, request);
    },

    resizeMachine: async (root, args = {}, request) => {
      const options = {
        path: `/machines/${args.id}?action=resize?package=${args.package}`
      };
      await CloudApi('fetch', options, request);
      return internals.resolvers.Query.machine(root, args, request);
    },

    enableMachineFirewall: async (root, { id }, request) => {
      await CloudApi('enableMachineFirewall', id, request);
      return internals.resolvers.Query.machine(root, { id }, request);
    },

    disableMachineFirewall: async (root, { id }, request) => {
      await CloudApi('disableMachineFirewall', id, request);
      return internals.resolvers.Query.machine(root, { id }, request);
    },

    createMachineSnapshot: async (root, { id, name }, request) => {
      await CloudApi('createMachineSnapshot', { id, name }, request);
      return internals.resolvers.Query.snapshots(root, { machine: id, name }, request);
    },

    startMachineFromSnapshot: async (root, { id, snapshot: name }, request) => {
      await CloudApi('startMachineFromSnapshot', { id, name }, request);
      return internals.resolvers.Query.machine(root, { id }, request);
    },

    deleteMachineSnapshot: async (root, { id, snapshot: name }, request) => {
      const snapshot = await CloudApi('getMachineSnapshot', { id, name }, request);
      await CloudApi('deleteMachineSnapshot', { id, name }, request);
      return snapshot;
    },

    updateMachineMetadata: async (root, { id, metadata }, request) => {
      const payload = JSON.stringify(internals.fromNameValues(metadata));

      const options = {
        path: `/machines/${id}/metadata`,
        method: 'post',
        payload: body
      };

      try {
        await CloudApi('fetch', options, request);
        return internals.resolvers.Query.machine(root, { id }, request);
      } catch (ex) {
        return;
      }
    },

    deleteMachineMetadata: async (root, { id, name }, request) => {
      const options = {
        path: `/machines/${id}/metadata/${encodeURIComponent(name)}`,
        method: 'delete'
      };

      await CloudApi('fetch', options, request);
      return internals.resolvers.Query.machine(root, { id }, request);
    },

    addMachineTags: async (root, { id, tags }, request) => {
      await CloudApi('addMachineTags', {
        id,
        tags: internals.fromNameValues(tags)
      }, request);

      return internals.resolvers.Query.machine(root, { id }, request);
    },

    replaceMachineTags: async (root, { id, tags }, request) => {
      await CloudApi('replaceMachineTags', {
        id,
        tags: internals.fromNameValues(tags)
      }, request);

      return internals.resolvers.Query.machine(root, { id }, request);
    },

    deleteMachineTag: async (root, { id, name: tag }, request) => {
      await CloudApi('deleteMachineTag', { id, tag }, request);
      return internals.resolvers.Query.machine(root, { id }, request);
    },

    deleteMachineTags: async (root, { id }, request) => {
      await CloudApi('deleteMachineTags', { id }, request);
      return internals.resolvers.Query.machine(root, { id }, request);
    },

    deleteMachine: async (root, { id }, request) => {
      const machine = await internals.resolvers.Query.machine(root, { id }, request);
      return CloudApi('deleteMachine', id, request);
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

    type: ({ type }) => { return (type ? type.toUpperCase() : type); }
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
    machines: (root, args, request) => {
      const { id } = root;
      return CloudApi(root, 'listFirewallRuleMachines', { id }, request);
    }
  },
  Snapshot: {
    state: ({ state }) => { return (state ? state.toUpperCase() : state); }
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

internals.fromNameValues = (nameValues) => {
  return ForceArray(nameValues).reduce((accumulator, { name, value }) => {
    return Object.assign(accumulator, {
      [name]: value
    });
  }, {});
};
