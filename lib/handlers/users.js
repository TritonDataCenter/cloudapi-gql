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
