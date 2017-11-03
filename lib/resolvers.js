'use strict';

const ForceArray = require('force-array');
const Hasha = require('hasha');
const CloudApi = require('./cloudapi');


const internals = {};

module.exports = internals.resolvers = {
  Query: {
    account: async (root, args = {}, request) => {
      return await CloudApi('getAccount', args, request);
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

      return await CloudApi('fetch', options, request);
    },

    key: async (root, { name }, request) => {
      const options = {
        path: `/keys/${name}`
      };

      return await CloudApi('fetch', options, request);
    },

    users: async (root, args = {}, request) => {
      if (args.id) {
        const user = await CloudApi('getUser', args, request);
        return [user];
      }

      return await CloudApi('listUsers', args, request);
    },

    user: async (root, args = {}, request) => {
      return await CloudApi('getUser', args, request);
    },

    roles: async (root, { id, name }, request) => {
      if (id || name) {
        const options = {
          path: `/roles/${id || name}`
        };
        const role = await CloudApi('fetch', options, request);
        return [role];
      }

      return await CloudApi('listRoles', {}, request);
    },

    role: async (root, { id, name }, request) => {
      const options = {
        path: `/roles/${id || name}`
      };
      return await CloudApi('fetch', options, request);
    },

    policies: async (root, args = {}, request) => {
      if (args.id) {
        const policy = await CloudApi('getPolicy', args, request);
        return [policy];
      }

      return await CloudApi('listPolicies', args, request);
    },

    policy: async (root, args = {}, request) => {
      return await CloudApi('getPolicy', args, request);
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

      return await CloudApi('listImages', args, request);
    },

    image: async (root, args = {}, request) => {
      return await CloudApi('getImage', args.id, request);
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

      return await CloudApi('listPackages', args, request);
    },

    package: async (root, args = {}, request) => {
      const options = {
        path: '/packages',
        default: {}
      };

      if (args.id) {
        options.path += '/' + args.id;
      } else if (args.name) {
        options.query = { name: args.name };
      }

      return await CloudApi('fetch', options, request);
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
        .filter(({ name }) => name.value === 'machines')
        .shift();

      if (!field) {
        return machinesList;
      }

      const prop = (field && field.selectionSet && field.selectionSet.selections || [])
        .filter(({ name }) => name.value === 'dns_names')
        .shift();

      if (!prop) {
        return machinesList;
      }

      const machines = [];
      for (let machine of machinesList) {
        machines.push(await CloudApi('getMachine', { id: machine.id }, request));
      }

      return machines;
    },

    machine: async (root, args, request) => {
      return await CloudApi('getMachine', args, request);
    },

    snapshots: async (root, { name, machine }, request) => {
      if (!machine) {
        return [];
      }

      if (name) {
        const snapshot = await internals.resolvers.Query.snapshot(root, { id: machine, name }, request);
        return [snapshot];
      }

      return await CloudApi('listMachineSnapshots', { id: machine }, request);
    },

    snapshot: async (root, { name, machine }, request) => {
      try {
        return await CloudApi('getMachineSnapshot', { id: machine, name }, request);
      } catch (ex) {
        return {};
      }
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

    actions: async (root, { machine }, request) => {
      return await CloudApi('machineAudit', machine, request);
    },

    // eslint-disable-next-line camelcase
    firewall_rules: async (root, { machine, id }, request) => {
      if (id) {
        const rule = await CloudApi('getFirewallRule', id, request);
        return [rule];
      }

      if (machine) {
        return await CloudApi('listMachineFirewallRules', { id: machine }, request);
      }

      return await CloudApi('listFirewallRules', args, request);
    },

    // eslint-disable-next-line camelcase
    firewall_rule: async (root, { id }, request) => {
      return await CloudApi('getFirewallRule', id, request);
    },

    vlans: async (root, { id }, request) => {
      const options = {
        path: '/fabrics/default/vlans'
      };

      if (id) {
        options.path += `/${id}`;
      }

      return await CloudApi('fetch', options, request);
    },

    vlan: async (root, { id }, request) => {
      const options = {
        path: `/fabrics/default/vlans/${id}`
      };

      return await CloudApi('fetch', options, request);
    },

    networks: async (root, args = {}, request) => {
      if (args.id) {
        return await CloudApi('getNetwork', args.id, request);
      }

      return await CloudApi('listNetworks', args, request);
    },

    network: async (root, { id }, request) => {
      return await CloudApi('getNetwork', id, request);
    },

    nics: async (root, args = {}, request) => {
      if (args.mac) {
        return await CloudApi('getNic', args, request);
      }

      return await CloudApi('listNics', args, request);
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
      return internals.resolvers.Query.machine(root, { id }, request)
    },

    startMachine: async (root, { id }, request) => {
      await CloudApi('startMachine', id, request);
      return internals.resolvers.Query.machine(root, { id }, request)
    },

    rebootMachine: async (root, { id }, request) => {
      await CloudApi('rebootMachine', id, request);
      return internals.resolvers.Query.machine(root, { id }, request)
    },

    resizeMachine: async (root, args = {}, request) => {
      const options = {
        path: `/machines/${args.id}?action=resize?package=${args.package}`
      };
      await CloudApi('fetch', options, request);
      return internals.resolvers.Query.machine(root, args, request)
    },

    enableMachineFirewall: async (root, { id }, request) => {
      await CloudApi('enableMachineFirewall', id, request);
      return internals.resolvers.Query.machine(root, { id }, request)
    },

    disableMachineFirewall: async (root, { id }, request) => {
      await CloudApi('disableMachineFirewall', id, request);
      return internals.resolvers.Query.machine(root, { id }, request)
    },

    createMachineSnapshot: async (root, { id, name }, request) => {
      await CloudApi('createMachineSnapshot', { id, name }, request);
      return internals.resolvers.Query.snapshots(root, { machine: id, name }, request);
    },

    startMachineFromSnapshot: async (root, { id, name }, request) => {
      await CloudApi('startMachineFromSnapshot', { id, name }, request);
      return internals.resolvers.Query.machine(root, { id }, request);
    },

    deleteMachineSnapshot: async (root, { id, snapshot: name }, request) => {
      const snapshot = await CloudApi('getMachineSnapshot', { id, name }, request);
      await CloudApi('deleteMachineSnapshot', { id, name }, request);
      return snapshot;
    },

    updateMachineMetadata: async (root, { id, metadata }, request) => {
      const body = JSON.stringify(internals.fromNameValues(metadata));

      const options = {
        path: `/machines/${id}/metadata`,
        headers: {
          'Content-Length': body.length
        },
        method: 'post',
        body,
      };

      await CloudApi('fetch', options, request);
      return internals.resolvers.Query.machine(root, { id }, request);
    },

    deleteMachineMetadata: async (root, { id, name }, request) => {
      const options = {
        path: `/machines/${id}/metadata/${encodeURIComponent(key)}`,
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

    replaceMachineTags: async (root, { id, tags }) => {
      await CloudApi('replaceMachineTags', {
        id,
        tags: internals.fromNameValues(tags)
      }, request);

      return internals.resolvers.Query.machine(root, { id }, request);
    },

    deleteMachineTag: async (root, { id, name: tag }) => {
      await CloudApi('deleteMachineTag', { id, tag }, request);
      return internals.resolvers.Query.machine(root, { id }, request);
    },

    deleteMachineTags: async (root, { id }) => {
      await CloudApi('deleteMachineTags', { id }, request);
      return internals.resolvers.Query.machine(root, { id }, request);
    }
  }
};

internals.resolvers = Object.assign(internals.resolvers, {
  User: {
    keys: internals.resolvers.Query.keys
  },
  Machine: {
    brand: ({ brand }) => (brand ? brand.toUpperCase() : brand),

    state: ({ state }) => (state ? state.toUpperCase() : state),

    image: ({ image }, root, request) => {
      return internals.resolvers.Query.image(root, { id: image }, request);
    },

    // eslint-disable-next-line camelcase
    primary_ip: ({ primaryIp }) => primaryIp,

    tags: ({ id, name }, root, request) => {
      return internals.resolvers.Query.tags(root, { machine: id, name }, request);
    },

    metadata: ({ id, name }, root, request) => {
      return internals.resolvers.Query.metadata(root, { machine: id, name }, request);
    },

    networks: ({ networks }, root, request) => {
      return Promise.all(networks.map(id => internals.resolvers.Query.network(root, { id }, request)))
    },

    // eslint-disable-next-line camelcase
    package: (args, root, request) => {
      return internals.resolvers.Query.package(root, { name: args.package }, request)
    },

    snapshots: ({ id, name }, root, request) => {
      return internals.resolvers.Query.snapshots(root, { machine: id, name }, request);
    },

    // eslint-disable-next-line camelcase
    firewall_rules: ({ id: machine, id }, root, request) => {
      return internals.resolvers.Query.firewall_rules(root, { machine, id }, request);
    },

    actions: ({ id }, root, request) => {
      return internals.resolvers.Query.actions(root, { machine: id }, request);
    }
  },
  Image: {
    os: ({ os }) => (os ? os.toUpperCase() : os),

    state: ({ state }) => (state ? state.toUpperCase() : state),

    type: ({ type }) => (type ? type.toUpperCase() : type)
  },
  Action: {
    name: ({ action }) => action,

    parameters: ({ parameters }) => internals.toNameValues(parameters)
  },
  Caller: {
    type: ({ type }) => (type ? type.toUpperCase() : type),

    // eslint-disable-next-line camelcase
    key_id: ({ keyId }) => keyId
  },
  FirewallRule: {
    machines: async (args, root, request) => {
      return await CloudApi(root, 'listFirewallRuleMachines', args, request);
    }
  },
  Snapshot: {
    state: ({ state }) => (state ? state.toUpperCase() : state)
  },
  ImageError: {
    code: ({ code }) => (code ? code.toUpperCase() : code)
  },
  ImageFile: {
    compression: ({ compression }) => compression ? compression.toUpperCase() : compression
  }
});


internals.toNameValues = (obj) => {
  if (!obj) {
    return [];
  }

  return Object.keys(obj).map((key) => {
    return {
      id: Hasha(JSON.stringify({ name: key, value: obj[key] })),
      key,
      value: obj[key]
    };
  });
};

internals.fromNameValues = (nameValues) => {
  return ForceArray(nameValues).reduce(
    (accumulator, { name, value }) => {
      return Object.assign(accumulator, {
        [name]: value
      });
    },
    {}
  );
};
