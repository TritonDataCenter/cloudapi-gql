'use strict';


exports.policy = (fetch, { id }) => {
  return fetch(`/policies/${id}`);
};

exports.policies = async (fetch, { id }) => {
  if (id !== undefined) {
    const policy = await exports.policy(fetch, { id });
    return [policy];
  }

  return fetch('/policies');
};

exports.createPolicy = (fetch, payload) => {
  return fetch('/policies', { method: 'post', payload });
};

exports.updatePolicy = (fetch, { id, ...payload }) => {
  return fetch(`/policies/${id}`, { method: 'post', payload });
};

exports.deletePolicy = async (fetch, { id }) => {
  const policy = await exports.policy(fetch, { id });
  await fetch(`/policies/${id}`, { method: 'delete' });
  return policy;
};
