'use strict';

const ForceArray = require('force-array');
const Hasha = require('hasha');
const Api = require('../api');

const internals = {};

module.exports = internals.resolvers = {
  Query: {
    account: async (args, request) => {
      return await Api.account.get(args, request);
    },

    keys: async ({ login, name }, request) => {
      if (name) {
        const key = await Api.keys.get({ login, name }, request);
        return [key];
      }

      return await Api.keys.list({ login, name }, request);
    },

    key: Api.keys.get,

    users: async ({ id }, request) => {
      if (id) {
        const user = await Api.users.get({ id }, request);
        return [user];
      }

      return await Api.users.list(request);
    },

    user: Api.users.get,

    roles: async ({ id, name }, request) => {
      if (id || name) {
        const role = await Api.roles.get({ id, name }, request);
        return [role];
      }

      return await Api.roles.list(request);
    },

    role: Api.roles.get,

    policies: async ({ id }, request) => {
      if (id) {
        const policy = await Api.policies.get({ id }, request);
        return [policy];
      }

      return await Api.policies.list(request);
    },

    policy: Api.policies.get,

    config: async (args, request) => {
      const config = await Api.config(request);

      return internals.toNameValues(config);
    },

    datacenters: async (args, request) => {
      const datacenters = await Api.datacenters(request);

      return Object.keys(datacenters).map((name) => {
        return {
          name,
          url: datacenters[name]
        };
      });
    },

    services: async (args, request) => {
      const services = await Api.services();

      return internals.toNameValues(services);
    },

    images: async (args, request) => {
      if (args.id) {
        const image = await Api.images.get(args, request);
        return [image];
      }

      return await Api.images.list(args, request);
    },

    image: Api.images.get,

    packages: async (args, request) => {
      if (args.id) {
        const pkg = await Api.packages.get(args, request);
        return [pkg];
      }

      return await Api.packages.list(args, request);
    },

    package: Api.packages.get,

    machines: async (args, request, context) => {
      if (args.id) {
        const machine = await Api.machines.get({ id: args.id }, request);
        return [internals.transform('Machine', machine, request)];
      }

      args.brand = args.brand && args.brand.toLowerCase();
      args.state = args.state && args.state.toLowerCase();
      args.tags = internals.fromNameValues(args.tags);

      const machinesList = await Api.machines.list(args, request);
      const field = ForceArray(context.fieldNodes)
        .filter(({ name }) => name.value === 'machines')
        .shift();

      if (!field) {
        return internals.transform('Machine', machinesList, request);
      }

      const prop = (field && field.selectionSet && field.selectionSet.selections || [])
        .filter(({ name }) => name.value === 'dns_names')
        .shift();

      if (!prop) {
        return internals.transform('Machine', machinesList, request);
      }

      const machines = [];
      for (let machine of machinesList) {
        machines.push(await Api.machines.get({ id: machine.id }, request));
      }

      return internals.transform('Machine', machines, request);
    },

    machine: async (args, request, context) => {
      const machine = await Api.machines.get(args, request, context);
      return internals.transform('Machine', machine, request);
    },

    snapshots: async ({ name, machine }, request) => {
      if (name) {
        const snapshot = await Api.machines.snapshots.get({ id: machine, name }, request);
        return [internals.transform('Snapshot', snapshot, request)];
      }

      const snapshots = await Api.machines.snapshots.list({ id: machine }, request);
      return internals.transform('Snapshot', snapshots, request);
    },

    snapshot: Api.machines.snapshots.get,

    metadata: async (args, request) => {
      args.key = args.name;
      args.id = args.machine;

      if (args.key) {
        const metadata = await Api.machines.metadata.get(args, request);
        return internals.toNameValues({ [args.name]: metadata });
      }

      const metadatas = await Api.machines.metadata.list(args, request);
      return internals.toNameValues(metadatas);
    },

    metadataValue: async ({ name, machine }, request) => {
      const metadata = await Api.machines.metadata.get({ key: name, id: machine }, request);
      return internals.toNameValues({ [name]: metadata }).shift();
    },

    tags: async ({ machine, name }, request) => {
      if (name) {
        const tag = await Api.machines.tags.get({ id: machine, tag: name }, request);
        return internals.toNameValues({ [name]: tag });
      }

      const tags = await Api.machines.tags.list({ id: machine }, request);
      return internals.toNameValues(tags);
    },

    tag: async ({ machine, name }, request) => {
      const tag = await Api.machines.tags.get({ id: machine, tag: name }, request);
      return internals.toNameValues({ [name]: tag }).shift();
    },

    actions: async ({ machine }, request) => {
      return await Api.machines.audit({ id: machine }, request);
    },

    // eslint-disable-next-line camelcase
    firewall_rules: async ({ machine, id }, request) => {
      if (id) {
        return await Api.firewall.get({ id }. request);
      }

      if (machine) {
        return await Api.firewall.listByMachine({ id: machine }, request);
      }

      return await Api.firewall.list(request);
    },

    // eslint-disable-next-line camelcase
    firewall_rule: Api.firewall.get,

    vlans: async ({ id }, request) => {
      if (id) {
        return await Api.vlans.get({ id }, request);
      }

      return await Api.vlans.list(request);
    },

    vlan: Api.vlans.get,

    networks: async ({ id, vlan }, request) => {
      if (id) {
        return await Api.networks.get({ id, vlan }, request);
      }

      return await Api.networks.list({ vlan }, request);
    },

    network: Api.networks.get,

    nics: (root, { machine, mac }) =>
      mac ? Api.nics.get({ machine, mac }) : Api.nics.list({ machine }),

    nic: (root, { machine, mac }) => Api.nics.get({ machine, mac })
  },

  Mutation: {
    stopMachine: (root, { id }) =>
      Api.machines.stop(id).then(() => resolvers.Query.machine(null, { id })),

    startMachine: (root, { id }) =>
      Api.machines.start(id).then(() => resolvers.Query.machine(null, { id })),

    rebootMachine: (root, { id }) =>
      Api.machines.reboot(id).then(() => resolvers.Query.machine(null, { id })),

    resizeMachine: (root, { id, ...args }) =>
      Api.machines
        .resize({ id, package: args.package })
        .then(() => internals.resolvers.Query.machine(null, { id })),

    enableMachineFirewall: (root, { id }) =>
      Api.machines.firewall
        .enable(id)
        .then(() => internals.resolvers.Query.machine(null, { id })),

    disableMachineFirewall: (root, { id }) =>
      Api.machines.firewall
        .disable(id)
        .then(() => internals.resolvers.Query.machine(null, { id })),

    createMachineSnapshot: (root, { id, name }) =>
      Api.machines.snapshots
        .create({ id, name })
        .then(() => internals.resolvers.Query.snapshots(null, { machine: id, name })),

    startMachineFromSnapshot: (root, { id, name }) =>
      Api.machines.snapshots
        .startFromSnapshot({ id, name })
        .then(() => internals.resolvers.Query.machine(null, { id })),

    deleteMachineSnapshot: async ({ id, snapshot: name }, request) => {
      const snapshot = await Api.machines.snapshots.get({ id, name }, request);
      await Api.machines.snapshots.destroy({ id, name }, request);
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
    package: (args, request) => internals.resolvers.Query.package({ name: args.package }, request),

    snapshots: ({ id, name }, request) =>
      internals.resolvers.Query.snapshots({ machine: id, name }, request),

    // eslint-disable-next-line camelcase
    firewall_rules: ({ id: machine, id }, request) =>
      internals.resolvers.Query.firewall_rules({ machine, id }, request),

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
    machines: Api.firewall.listMachines
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
