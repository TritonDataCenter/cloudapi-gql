'use strict';


exports.account = (fetch) => {
  return fetch('');
};

exports.updateAccount = (fetch, payload) => {
  return fetch('/', { method: 'post', payload });
};

exports.user = (fetch, { id }) => {
  return fetch(`/users/${id}`);
};

exports.users = async (fetch, { id }) => {
  if (id !== undefined) {
    const user = await exports.user(fetch, { id });
    return [user];
  }

  return fetch('/users');
};

exports.createUser = (fetch, payload) => {
  return fetch('/users', { method: 'post', payload });
};

exports.updateUser = (fetch, { id, ...payload }) => {
  return fetch(`/users/${id}`, { method: 'post', payload });
};

exports.changeUserPassword = (fetch, { id, ...payload }) => {
  return fetch(`/users/${id}/change_password`, { method: 'post', payload });
};

exports.deleteUser = async (fetch, { id }) => {
  const user = await exports.user(fetch, { id });
  await fetch(`/users/${id}`, { method: 'delete' });
  return user;
};
