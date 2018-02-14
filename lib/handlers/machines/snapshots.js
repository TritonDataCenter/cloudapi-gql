'use strict';


exports.snapshot = (fetch, { machine, name }) => {
  return fetch(`/machines/${machine}/snapshots/${name}`);
};

exports.snapshots = async (fetch, { machine, name }) => {
  if (name !== undefined) {
    const snapshot = await exports.snapshot(fetch, { machine, name });
    return [snapshot];
  }

  return fetch(`/machines/${machine}/snapshots`);
};

exports.createMachineSnapshot = (fetch, { id, name }) => {
  const payload = { name };

  return fetch(`/machines/${id}/snapshots`, { method: 'post', payload });
};

exports.startMachineFromSnapshot = async (fetch, { id, snapshot }) => {
  await fetch(`/machines/${id}/snapshots/${snapshot}`, { method: 'post' });
  return fetch(`/machines/${id}`);
};

exports.deleteMachineSnapshot = async (fetch, { id, snapshot }) => {
  await fetch(`/machines/${id}/snapshots/${snapshot}`, { method: 'delete' });
  return fetch(`/machines/${id}`);
};
