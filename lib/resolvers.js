'use strict';

const ForceArray = require('force-array');
const Hasha = require('hasha');
const CloudApi = require('./cloudapi');


const internals = {};

module.exports = internals.resolvers = {
  Query: {
    account: async (args, request) => {
      return await CloudApi('getAccount', args, request);
    },

    keys: async ({ name }, request) => {
      const options = {
        path: '/my/keys'
      };

      if (name) {
        options.path += `/${name}`;

        const key = await CloudApi('fetch', options, request);
        return [key];
      }

      return await CloudApi('fetch', options, request);
    },

    key: async ({ name }, request) => {
      const options = {
        path: `/my/keys/${name}`
      };

      return await CloudApi('fetch', options, request);
    },

    users: async (args = {}, request) => {
      if (args.id) {
        const user = await CloudApi('getUser', args, request);
        return [user];
      }

      return await CloudApi('listUsers', args, request);
    },

    user: async (args = {}, request) => {
      return await CloudApi('getUser', args, request);
    },

    roles: async ({ id, name }, request) => {
      if (id || name) {
        const options = {
          path: `/roles/${id || name}`
        };
        const role = await CloudApi('fetch', options, request);
        return [role];
      }

      return await CloudApi('listRoles', {}, request);
    },

    role: async ({ id, name }, request) => {
      const options = {
        path: `/roles/${id || name}`
      };
      return await CloudApi('fetch', options, request);
    },

    policies: async (args = {}, request) => {
      if (args.id) {
        const policy = await CloudApi('getPolicy', args, request);
        return [policy];
      }

      return await CloudApi('listPolicies', args, request);
    },

    policy: async (args = {}, request) => {
      return await CloudApi('getPolicy', args, request);
    },

    config: async (args, request) => {
      const options = {
        path: '/my/config'
      };
      const config = await CloudApi('fetch', options, request);

      return internals.toNameValues(config);
    },

    datacenters: async (args = {}, request) => {
      const datacenters = await CloudApi('listDatacenters', args, request);

      return Object.keys(datacenters).map((name) => {
        return {
          name,
          url: datacenters[name]
        };
      });
    },

    services: async (args, request) => {
      const services = await CloudApi('listServices', args, request);
      return internals.toNameValues(services);
    },

    images: async (args = {}, request) => {
      if (args.id) {
        const image = await CloudApi('getImage', args.id, request);
        return [image];
      }

      args.type = args.type && args.type.toLowerCase();
      args.os = args.os && args.os.toLowerCase();
      args.state = args.state && args.state.toLowerCase();

      return await CloudApi('listImages', args, request);
    },

    image: async (args = {}, request) => {
      return await CloudApi('getImage', args.id, request);
    },

    packages: async (args = {}, request) => {
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

    package: async (args = {}, request) => {
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

    machines: async (args = {}, request, context) => {
      if (args.id) {
        const machine = await CloudApi('getMachine', { id: args.id }, request);
        return [machine];
      }

      args.brand = args.brand && args.brand.toLowerCase();
      args.state = args.state && args.state.toLowerCase();
      args.tags = internals.fromNameValues(args.tags);

      const machinesList = await CloudApi('listMachines', args, request);
      const field = ForceArray(context.fieldNodes)
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

    machine: async (args, request) => {
      return await CloudApi('getMachine', args, request);
    },

    snapshots: async ({ name, machine }, request) => {
      if (name) {
        const snapshot = await internals.resolvers.Query.snapshot({ id: machine, name }, request);
        return [snapshot];
      }

      return await CloudApi('listMachineSnapshots', { id: machine }, request);
    },

    snapshot: async ({ name, machine }, request) => {
      try {
        return await CloudApi('getMachineSnapshot', { id: machine, name }, request);
      } catch (ex) {
        return {};
      }
    },

    metadata: async (args = {}, request) => {
      args.key = args.name;
      args.id = args.machine;

      if (args.key) {
        const options = {
          path: `/my/machines/${args.id}/metadata/${args.key}`,
          default: []
        };
        const metadata = await CloudApi('fetch', options, request);
        return internals.toNameValues({ [args.name]: metadata });
      }

      const options = {
        path: `/my/machines/${args.id}/metadata`
      };

      const metadatas = await CloudApi('fetch', options, request);
      return internals.toNameValues(metadatas);
    },

    metadataValue: async (args = {}, request) => {
      const options = {
        path: `/my/machines/${args.machine}/metadata/${args.name}`,
        default: []
      };
      const metadata = await CloudApi('fetch', options, request);
      return internals.toNameValues({ [args.name]: metadata }).shift();
    },

    tags: async ({ machine, name }, request) => {
      if (name) {
        const tag = await CloudApi('getMachineTag', { id: machine, tag: name }, request);
        return internals.toNameValues({ [name]: tag });
      }

      const tags = await CloudApi('listMachineTags', { id: machine }, request);
      return internals.toNameValues(tags);
    },

    tag: async ({ machine, name }, request) => {
      const tag = await CloudApi('getMachineTag', { id: machine, tag: name }, request);
      return internals.toNameValues({ [name]: tag }).shift();
    },

    actions: async ({ machine }, request) => {
      return await CloudApi('machineAudit', machine, request);
    },

    // eslint-disable-next-line camelcase
    firewall_rules: async ({ machine, id }, request) => {
      if (id) {
        return await CloudApi('getFirewallRule', id, request);
      }

      if (machine) {
        return await CloudApi('listMachineFirewallRules', { id: machine }, request);
      }

      return await CloudApi('listFirewallRules', args, request);
    },

    // eslint-disable-next-line camelcase
    firewall_rule: async ({ id }, request) => {
      return await CloudApi('getFirewallRule', id, request);
    },

    vlans: async ({ id }, request) => {
      const options = {
        path: '/fabrics/default/vlans'
      };

      if (id) {
        options.path += `/${id}`;
      }

      return await CloudApi('fetch', options, request);
    },

    vlan: async ({ id }, request) => {
      const options = {
        path: `/fabrics/default/vlans/${id}`
      };

      return await CloudApi('fetch', options, request);
    },

    networks: async (args = {}, request) => {
      if (args.id) {
        return await CloudApi('getNetwork', args.id, request);
      }

      return await CloudApi('listNetworks', args, request);
    },

    network: async ({ id }, request) => {
      return await CloudApi('getNetwork', id, request);
    },

    nics: async (args = {}, request) => {
      if (args.mac) {
        return await CloudApi('getNic', args, request);
      }

      return await CloudApi('listNics', args, request);
    }
  },

  Mutation: {
    updateAccount: (args, request) => {
      return CloudApi('updateAccount', args, request);
    },

    createKey: ({ name, key }, request) => {
      const options = {
        path: '/my/keys/',
        method: 'post',
        payload: { name, key }
      };

      return CloudApi('fetch', options, request);
    },

    deleteKey: ({ name }, request) => {
      const options = {
        path: `/my/keys/${name}`,
        method: 'delete'
      };

      return CloudApi('fetch', options, request);
    },

    stopMachine: async ({ id }, request) => {
      await CloudApi('stopMachine', id, request);
      return internals.resolvers.Query.machine({ id }, request)
    },

    startMachine: async ({ id }, request) => {
      await CloudApi('startMachine', id, request);
      return internals.resolvers.Query.machine({ id }, request)
    },

    rebootMachine: async ({ id }, request) => {
      await CloudApi('rebootMachine', id, request);
      return internals.resolvers.Query.machine({ id }, request)
    },

    resizeMachine: async (args = {}, request) => {
      const options = {
        path: `/my/machines/${args.id}?action=resize?package=${args.package}`
      };
      await CloudApi('fetch', options, request);
      return internals.resolvers.Query.machine(args, request)
    },

    enableMachineFirewall: async ({ id }, request) => {
      await CloudApi('enableMachineFirewall', id, request);
      return internals.resolvers.Query.machine({ id }, request)
    },

    disableMachineFirewall: async ({ id }, request) => {
      await CloudApi('disableMachineFirewall', id, request);
      return internals.resolvers.Query.machine({ id }, request)
    },

    createMachineSnapshot: async ({ id, name }, request) => {
      await CloudApi('createMachineSnapshot', { id, name }, request);
      return internals.resolvers.Query.snapshots({ machine: id, name }, request);
    },

    startMachineFromSnapshot: async ({ id, name }, request) => {
      await CloudApi('startMachineFromSnapshot', { id, name }, request);
      return internals.resolvers.Query.machine({ id }, request);
    },

    deleteMachineSnapshot: async ({ id, snapshot: name }, request) => {
      const snapshot = await CloudApi('getMachineSnapshot', { id, name }, request);
      await CloudApi('deleteMachineSnapshot', { id, name }, request);
      return snapshot;
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

    image: ({ image }, request) => internals.resolvers.Query.image({ id: image }, request),

    // eslint-disable-next-line camelcase
    primary_ip: ({ primaryIp }) => primaryIp,

    tags: ({ id, name }, request) =>
      internals.resolvers.Query.tags({ machine: id, name }, request),

    metadata: ({ id, name }, request) =>
      internals.resolvers.Query.metadata({ machine: id, name }, request),

    networks: ({ networks }, request) =>
      Promise.all(networks.map(id => internals.resolvers.Query.network({ id }, request))),

    // eslint-disable-next-line camelcase
    package: (args, request) => {
      return internals.resolvers.Query.package({ name: args.package }, request)
    },

    snapshots: ({ id, name }, request) =>
      internals.resolvers.Query.snapshots({ machine: id, name }, request),

    // eslint-disable-next-line camelcase
    firewall_rules: ({ id: machine, id }, request) => {
      return internals.resolvers.Query.firewall_rules({ machine, id }, request);
    },

    actions: ({ id }, request) => internals.resolvers.Query.actions({ machine: id }, request)
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
    machines: async (args, request) => {
      return await CloudApi('listFirewallRuleMachines', args, request);
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
      id: Hasha(JSON.stringify({ name, value: obj[key] })),
      key,
      value: obj[name]
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
