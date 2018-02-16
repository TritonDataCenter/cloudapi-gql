'use strict';

exports.role = (fetch, { id, name }) => {
  return fetch(`/roles/${id || name}`);
};

exports.roles = async (fetch, { id, name }) => {
  if (id || name) {
    const role = await exports.role(fetch, { id, name });
    return [role];
  }

  return fetch('/roles');
};

exports.createRole = (fetch, payload) => {
  return fetch('/roles', { method: 'post', payload });
};

exports.updateRole = (fetch, { id, ...payload }) => {
  return fetch(`/roles/${id}`, { method: 'post', payload });
};

exports.deleteRole = async (fetch, { id }) => {
  const role = await exports.role(fetch, { id });
  await fetch(`/roles/${id}`, { method: 'delete' });
  return role;
};
