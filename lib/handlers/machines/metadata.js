'use strict';

const Utils = require('../../utils');


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

exports.updateMachineMetadata = async (fetch, { id, metadata }) => {
  const payload = Utils.fromNameValues(metadata);

  await fetch(`/machines/${id}/metadata`, { method: 'post', payload });
  return fetch(`/machines/${id}`);
};

exports.deleteMachineMetadata = async (fetch, { id, name }) => {
  await fetch(`/machines/${id}/metadata/${encodeURIComponent(name)}`, { method: 'delete' });
  return fetch(`/machines/${id}`);
};

exports.deleteAllMachineMetadata = async (fetch, { id }) => {
  await fetch(`/machines/${id}/metadata`, { method: 'delete' });
  return fetch(`/machines/${id}`);
};
