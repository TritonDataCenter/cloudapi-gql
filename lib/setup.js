'use strict';

const Assert = require('assert');
const CloudApi = require('webconsole-cloudapi-client');

exports.setupCloudApi = ({ keyId, key, apiBaseUrl }) => {
  return ({ auth, log }) => {
    return new CloudApi({
      token: auth.credentials && auth.credentials.token,
      url: apiBaseUrl,
      keyId,
      key,
      log
    });
  };
};

exports.preResolve = (cloudapi) => {
  return (root, args, request) => {
    if (request.route.settings.auth === false) {
      return;
    }

    return cloudapi({ auth: request.auth, log: request.log.bind(request) });
  };
};

exports.postAuth = (cloudapi) => {
  return (request, h) => {
    if (request.route.settings.auth === false) {
      return h.continue;
    }

    request.plugins.cloudapi = cloudapi({ auth: request.auth, log: request.log.bind(request) });

    return h.continue;
  };
};

exports.graphqlHandler = function (route, options) {
  Assert(typeof options.method === 'function', 'method must be a function');

  return function (request, h) {
    const fetch = request.plugins.cloudapi.fetch.bind(request.plugins.cloudapi);
    return options.method(fetch, request.payload, request);
  };
};
