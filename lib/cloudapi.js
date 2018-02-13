'use strict';

const Hasha = require('hasha');
const Assert = require('assert');
const Crypto = require('crypto');
const QueryString = require('querystring');
const Bounce = require('bounce');
const Wreck = require('wreck');
const Boom = require('boom');


class CloudApi {
  constructor ({ token, url, keyId, key }) {
    const env = process.env.NODE_ENV;
    Assert(token || (env === 'development') || (env === 'test'), 'token is required for production');

    this._token = token;
    this._keyId = keyId;
    this._key = key;
    this._cache = {};
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
    const signature = signer.sign(this._key, 'base64');

    const headers = {
      'Content-Type': 'application/json',
      Date: now,
      Authorization: `Signature keyId="${this._keyId}",algorithm="rsa-sha256" ${signature}`
    };

    if (this._token) {
      headers['X-Auth-Token'] = this._token;
    }

    return headers;
  }

  _getCache (method = '', path, options) {
    if (method.toLowerCase() !== 'get') {
      return;
    }

    const ref = Hasha(JSON.stringify({ method, path, options }));
    const { val, when } = this._cache[ref] || {};
    const now = new Date().getTime();

    if (!when) {
      return;
    }

    // cache is no logner fresh
    if (now - when > 9000) {
      delete this._cache[ref];
      return val;
    }

    return val;
  }

  _setCache (method = '', path, options, payload) {
    if (method.toLowerCase() !== 'get') {
      return;
    }

    const ref = Hasha(JSON.stringify({ method, path, options }));

    this._cache[ref] = {
      when: new Date().getTime(),
      val: payload
    };
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

    const cached = this._getCache(method, path, wreckOptions);
    if (cached) {
      return cached;
    }

    try {
      const { payload } = await this._wreck[method](path, wreckOptions);
      this._setCache(method, path, options, payload);
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
  return request.plugins.cloudapi.fetch(path, args, request);
};

module.exports.CloudApi = CloudApi;
