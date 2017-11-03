'use strict';

const CloudApi = require('./cloudapi');


exports.list = (args, request) => {
  return CloudApi('listMachines', args, request);
};

exports.get = (args, request) => {
  return CloudApi('getMachine', args, request);
};

exports.create = (args, request) => {
  return CloudApi('createMachine', args, request);
};

exports.stop = (ctx) => { return CloudApi('stopMachine', ctx); };
exports.start = (uuid) => { return CloudApi('startMachine', uuid); };
exports.startFromSnapshot = (ctx) => { return CloudApi('startMachineFromSnapshot', ctx); };
exports.reboot = (ctx) => { return CloudApi('rebootMachine', ctx); };

exports.resize = (args, request) => {
  const options = {
    path: `/my/machines/${args.id}?action=resize?package=${args.package}`
  };
  return CloudApi('fetch', options, request);
};

exports.rename = (ctx) => { return CloudApi('', ctx); };
module.exports.destroy = (ctx) => { return CloudApi('deleteMachine', ctx); };
module.exports.audit = ({ id }) => { return CloudApi('machineAudit', id); };

module.exports.snapshots = {
  list: (ctx) => { return CloudApi('listMachineSnapshots', ctx); },
  get: (ctx) => { return CloudApi('getMachineSnapshot', ctx); },
  create: (ctx) => { return CloudApi('createMachineSnapshot', ctx); },
  destroy: (ctx) => { return CloudApi('deleteMachineSnapshot', ctx); }
};

module.exports.metadata = {
  list: ({ id }, request) => {
    const options = {
      path: `/my/machines/${id}/metadata`
    };
    return CloudApi('fetch', options, request);
  },
  get: ({ id, key }, request) => {
    const options = {
      path: `/my/machines/${id}/metadata/${key}`
    };
    return CloudApi('fetch', options, request);
  },
  destroy: (ctx) => { return Request('', ctx); }
};

exports.firewall = {
  enable: (ctx) => { return CloudApi('enableMachineFirewall', ctx); },
  disable: (ctx) => { return CloudApi('disableMachineFirewall', ctx); }
};

exports.tags = {
  list: (ctx) => { return CloudApi('listMachineTags', ctx); },
  get: (ctx) => { return CloudApi('getMachineTag', ctx); },
  add: (ctx) => { return CloudApi('addMachineTags', ctx); },
  replace: (ctx) => { return CloudApi('replaceMachineTags', ctx); },
  destroy: (ctx) => { return CloudApi(ctx.tag ? 'deleteMachineTag' : 'deleteMachineTags', ctx); }
};
