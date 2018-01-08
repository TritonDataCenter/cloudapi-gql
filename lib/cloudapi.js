'use strict';

const Assert = require('assert');
const Crypto = require('crypto');
const Fs = require('fs');
const QueryString = require('querystring');
const Bounce = require('bounce');
const Wreck = require('wreck');
const Boom = require('boom');

const { NODE_ENV, SDC_ACCOUNT, SDC_KEY_ID, SDC_KEY_PATH } = process.env;

// required for signing requests
const KEY_ID = `/${SDC_ACCOUNT}/keys/${SDC_KEY_ID}`;
const KEY = Fs.readFileSync(SDC_KEY_PATH);

class CloudApi {
  constructor ({ token, url }) {
    Assert(token || (NODE_ENV === 'development') || (NODE_ENV === 'test'), 'token is required for production');

    this._token = token;
    this._wreck = Wreck.defaults({
      headers: this._authHeaders(),
      baseUrl: `${url}/my`,
      json: true
    });
  }

  _authHeaders () {
    const now = new Date().toUTCString();
    const signer = Crypto.createSign('sha256');
    signer.update(now);
    const signature = signer.sign(KEY, 'base64');

    const headers = {
      'Content-Type': 'application/json',
      Date: now,
      Authorization: `Signature keyId="${KEY_ID}",algorithm="rsa-sha256" ${signature}`
    };

    if (this._token) {
      headers['X-Auth-Token'] = this._token;
    }

    return headers;
  }

  async fetch (path = '/', options = {}, request) {
    const wreckOptions = {
      json: true,
      payload: options.payload,
      headers: options.headers
    };

    if (options.query) {
      path += `?${QueryString.stringify(options.query)}`;
    }

    const method = options.method && options.method.toLowerCase() || 'get';

    try {
      const { payload } = await this._wreck[method](path, wreckOptions);
      return payload;
    } catch (ex) {
      request.log(['error', path], (ex.data && ex.data.payload) || ex);
      Bounce.rethrow(ex, 'system');

      if (options.default !== undefined) {
        return options.default;
      }

      if (ex.data && ex.data.payload && ex.data.payload.message) {
        throw new Boom(ex.data.payload.message, ex.output.payload);
      }

      throw ex;
    }
  }
}

module.exports = (path, args, request) => {
  const { cloudapi } = request.plugins;
  return cloudapi.fetch(path, args, request);
};

module.exports.CloudApi = CloudApi;
