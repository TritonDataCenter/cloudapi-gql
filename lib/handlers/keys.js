'use strict';


exports.key = (fetch, { name }) => {
  return fetch(`/keys/${name}`);
};

exports.keys = async (fetch, { name }) => {
  if (name !== undefined) {
    const key = await exports.key(fetch, { name });
    return [key];
  }

  return fetch('/keys');
};

exports.createKey = (fetch, { user, name, key }) => {
  const path = user ? `/users/${user}/keys` : '/keys';

  return fetch(path, { method: 'post', payload: { name, key } });
};

exports.deleteKey = (fetch, { user, name, fingerprint }) => {
  const resource = name || fingerprint;
  const path = user ? `/users/${user}/keys/${resource}` : `/keys/${resource}`;

  return fetch(path, { method: 'delete' });
};
