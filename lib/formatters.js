'use strict';

const ForceArray = require('force-array');
const Hasha = require('hasha');
const FWRule = require('fwrule');
const Uniq = require('lodash.uniq');

const Handlers = require('./handlers');
const Utils = require('./utils');


module.exports = {
  NIC: {
    network: function ({ network }, args, request) {
      return Handlers.network(this.fetch, { id: network });
    }
  },
  User: {
    keys: function (root, args, request) {
      return Handlers.keys(this.fetch, args);
    }
  },
  Machine: {
    brand: ({ brand }) => { return (brand ? brand.toUpperCase() : brand); },

    state: ({ state }) => { return (state ? state.toUpperCase() : state); },

    image: function (root, args, request) {
      return Handlers.image(this.fetch, { id: root.image, brand: root.brand });
    },

    // eslint-disable-next-line camelcase
    primary_ip: ({ primaryIp }) => { return primaryIp; },

    tags: function (root, { name }, request) {
      const { id: machine } = root;

      return Handlers.tags(this.fetch, { machine, name });
    },

    metadata: function (root, { name }, request) {
      const { id: machine, metadata } = root;
      return metadata ? Utils.toNameValues(metadata) : Handlers.metadata(this.fetch, { machine, name });
    },

    networks: async function (root, args, request) {
      const networks = [];
      for (const id of root.networks) {
        const network = await Handlers.network(this.fetch, { id });
        networks.push(network);
      }

      return networks;
    },

    // eslint-disable-next-line camelcase
    package: function (root, args, request) {
      return Handlers.package(this.fetch, { name: root.package });
    },

    snapshots: function (root, { name }, request) {
      const { id: machine } = root;
      return Handlers.snapshots(this.fetch, { machine, name });
    },

    // eslint-disable-next-line camelcase
    firewall_rules: function (root, { id }, request) {
      const { id: machine } = root;
      return Handlers.firewall_rules(this.fetch, { machine, id });
    },

    actions: function (root, args, request) {
      const { id: machine } = root;
      return Handlers.actions(this.fetch, { machine });
    }
  },
  Image: {
    os: ({ os }) => { return (os ? os.toUpperCase() : os); },

    state: ({ state }) => { return (state ? state.toUpperCase() : state); },

    type: ({ type }) => { return (type ? type.replace('-', '_').toUpperCase() : type); }
  },
  Action: {
    name: ({ action }) => { return action; },

    parameters: ({ parameters }) => { return Utils.toNameValues(parameters); }
  },
  Caller: {
    type: ({ type }) => { return (type ? type.toUpperCase() : type); },

    // eslint-disable-next-line camelcase
    key_id: ({ keyId }) => { return keyId; }
  },
  FirewallRule: {
    machines: function ({ id }, args, request) {
      return this.fetch(`/fwrules/${id}/machines`);
    },
    rule_str: ({ rule }) => { return rule; },
    rule_obj: ({ rule }) => {
      const parsed = FWRule.parse(rule);
      const _from = ForceArray(parsed.from);
      const _to = ForceArray(parsed.to);

      const getTags = (partial) => {
        return partial
          .map((partial) => { return ForceArray(partial); })
          .filter((partial) => { return partial[0] === 'tag'; })
          .map((partial) => { return [partial[0], ForceArray(partial[1])]; })
          .filter((partial) => { return partial[1]; })
          .filter((partial) => { return partial[1][0]; })
          .map((partial) => {
            return {
              name: partial[1][0],
              value: partial[1][1]
            };
          });
      };

      const isWildcard = (
        _from.some((frm) => { return frm[0] === 'wildcard'; }) &&
        _to.some((to) => { return to[0] === 'wildcard'; })
      );

      const tags = Uniq(getTags(_from).concat(getTags(_to)));

      return {
        ...parsed,
        isWildcard,
        tags
      };
    }
  },
  Snapshot: {
    state: ({ state }) => { return (state ? state.toUpperCase() : state); },
    id: ({ name }) => { return Hasha(name); }
  },
  ImageError: {
    code: ({ code }) => { return (code ? code.toUpperCase() : code); }
  },
  ImageFile: {
    compression: ({ compression }) => {
      return (compression ? compression.toUpperCase() : compression);
    }
  },
  Network: {
    machines: async function ({ id, fabric }, args, request) {
      if (!fabric) {
        return [];
      }

      const machines = await this.fetch('/machines');

      return ForceArray(machines).filter(({ networks }) => {
        return ForceArray(networks).some((network) => { return network === id; });
      });
    }
  }
};
