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
