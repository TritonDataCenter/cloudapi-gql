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


