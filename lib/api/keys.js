'use strict';

const CloudApi = require('./cloudapi');


exports.list = (args, request) => {
  const options = {
    path: '/my/keys'
  };
  return CloudApi('fetch', options, request);
};

exports.get = ({ name }, request) => {
  const options = {
    path: `/my/keys/${name}`
  };
  return CloudApi('fetch', options, request);
};

exports.create = ({ name, key }, request) => {
  const options = {
    path: '/my/keys/',
    method: 'post',
    payload: { name, key }
  };

  return CloudApi('fetch', options, request);
};

exports.destroy = ({ name }, request) => {
  const options = {
    path: `/my/keys/${name}`,
    method: 'delete'
  };

  return CloudApi('fetch', options, request);
};
