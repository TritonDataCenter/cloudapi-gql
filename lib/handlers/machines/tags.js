'use strict';

const Utils = require('../../utils');

exports.tag = async (fetch, { machine, name }) => {
  const tag = await fetch(`/machines/${machine}/tags/${name}`);
  return Utils.toNameValues({ [name]: tag }).shift();
};

exports.tags = async (fetch, { machine, name }) => {
  if (name !== undefined) {
    const tag = await exports.tag(fetch, { machine, name });
    return [tag];
  }

  const tags = await fetch(`/machines/${machine}/tags`);
  return Utils.toNameValues(tags);
};

exports.addMachineTags = async (fetch, { id, tags }) => {
  const payload = Utils.fromNameValues(tags);

  await fetch(`/machines/${id}/tags`, { method: 'post', payload });
  return fetch(`/machines/${id}`);
};

exports.replaceMachineTags = async (fetch, { id, tags }) => {
  const payload = Utils.fromNameValues(tags);

  await fetch(`/machines/${id}/tags`, { method: 'put', payload });
  return fetch(`/machines/${id}`);
};

exports.deleteMachineTag = async (fetch, { id, name }) => {
  await fetch(`/machines/${id}/tags/${encodeURIComponent(name)}`, { method: 'delete' });
  return fetch(`/machines/${id}`);
};

exports.deleteMachineTags = async (fetch, { id }) => {
  await fetch(`/machines/${id}/tags`, { method: 'delete' });
  return fetch(`/machines/${id}`);
};
