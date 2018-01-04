'use strict';

const Assert = require('assert');
const Crypto = require('crypto');
const Fs = require('fs');
const QueryString = require('querystring');
const Util = require('util');
const Bounce = require('bounce');
const Bunyan = require('bunyan');
const CloudApi = require('triton/lib/cloudapi2');
const Wreck = require('wreck');
const Boom = require('boom');

const internals = {
  url: process.env.SDC_URL,
  keyId: process.env.SDC_KEY_ID,
  key: Fs.readFileSync(process.env.SDC_KEY_PATH),
  log: Bunyan.createLogger({
    name: 'cloudapi'
  })
};

const ERRORS = [
  'BadRequest',
  'InternalError',
  'InUseError',
  'InvalidArgument',
  'InvalidCredentials',
  'InvalidHeader',
  'InvalidVersion',
  'MissingParameter',
  'NotAuthorized',
  'RequestThrottled',
  'RequestTooLarge',
  'RequestMoved',
  'ResourceNotFound',
  'UnknownError',
  'ServiceUnavailable'
];


module.exports = async function (methodName, args, request) {
  const token = request.auth && request.auth.credentials && request.auth.credentials.token;
  const cloudapi = new internals.CloudApi({ token, request });

  if (methodName === 'fetch') {
    return cloudapi.fetch(args);
  }

  const method = Util.promisify(cloudapi[methodName]);
  let res;
  try {
    res = await method.call(cloudapi, args || {});
  } catch (ex) {
    request.log(['error', 'cloudapi'], ex);
    const { name } = ex;
    Bounce.rethrow(ex, 'system');

    const isCloudapiError = (
      name &&
      (ERRORS.indexOf(name) >= 0 ||
        ERRORS.indexOf(name.replace(/Error$/, "")) >= 0)
    );

    if (isCloudapiError) {
      throw ex;
    }
  }

  return res;
};

internals.CloudApi = class extends CloudApi.CloudApi {
  constructor (options = {}) {
    Assert(options.token || (process.env.NODE_ENV === 'development'), 'token is required for production');
    options.url = internals.url;
    options.account = 'my';
    options.sign = () => {};
    options.log = internals.log;
    super(options);

    this.token = options.token;
    this.request = options.request;
  }

  authHeaders () {
    const now = new Date().toUTCString();
    const signer = Crypto.createSign('sha256');
    signer.update(now);
    const signature = signer.sign(internals.key, 'base64');

    const headers = {
      Date: now,
      Authorization: `Signature keyId="${internals.keyId}",algorithm="rsa-sha256" ${signature}`
    };

    if (this.token) {
      headers['X-Auth-Token'] = this.token;
    }

    return headers;
  }

  _getAuthHeaders (method, path, callback) {
    return callback(null, this.authHeaders());
  }

  async fetch (options = {}) {
    const wreckOptions = {
      headers: this.authHeaders(),
      baseUrl: internals.url + `/${this.account}`,
      json: true,
      payload: options.payload
    };

    if (options.query) {
      options.path += `?${QueryString.stringify(options.query)}`;
    }

    wreckOptions.headers = Object.assign({
      'Content-Type': 'application/json'
    }, wreckOptions.headers, options.headers);

    const method = options.method && options.method.toLowerCase() || 'get';

    let payload;
    try {
      const res = await Wreck[method](options.path, wreckOptions);
      payload = res.payload;
    } catch (ex) {
      this.request.log(['error', options.path], (ex.data && ex.data.payload) || ex);
      Bounce.rethrow(ex, 'system');

      if (options.default !== undefined) {
        return options.default;
      }

      if (ex.data && ex.data.payload && ex.data.payload.message) {
        throw new Boom(ex.data.payload.message, ex.output.payload);
      }
    }

    return payload;
  }
};
