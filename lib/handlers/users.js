'use strict';

exports.account = (request, h) => {
  return request.plugins.cloudapi.fetch('', {}, request);
};

exports.updateAccount = (request, h) => {
  return request.plugins.cloudapi.fetch('/', { method: 'post', payload: request.payload }, request);
};

exports.user = (request, h) => {
  return request.plugins.cloudapi.fetch(`/users/${request.payload.id}`, {}, request);
};

exports.users = async (request, h) => {
  if (request.payload.id !== undefined) {
    const user = await exports.user(request, h);
    return [user];
  }

  return request.plugins.cloudapi.fetch('/users', {}, request);
};
