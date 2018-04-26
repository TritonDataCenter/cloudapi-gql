'use strict';

const { AssertionError } = require('assert');
const Fs = require('fs');
const Path = require('path');
const { expect } = require('code');
const Lab = require('lab');
const StandIn = require('stand-in');
const CloudApi = require('webconsole-cloudapi-client');


const lab = exports.lab = Lab.script();
const { describe, it } = lab;

describe('cloudapi', () => {
  const keyId = 'ba:co:n1';
  const key = Fs.readFileSync(Path.join(__dirname, 'helpers', 'test.key'));
  const log = () => {};

  it('throws when missing a token in production', () => {
    const env = process.env.NODE_ENV;
    process.env.NODE_ENV = 'production';
    expect(() => { return new CloudApi({ keyId, key, log }); }).to.throw(AssertionError);
    process.env.NODE_ENV = env;
  });

  it('won\'t throw when missing a token in development', () => {
    const env = process.env.NODE_ENV;
    process.env.NODE_ENV = 'development';
    expect(() => { return new CloudApi({ keyId, key, log }); }).to.not.throw();
    process.env.NODE_ENV = env;
  });

  it('won\'t throw when missing a token in test', () => {
    const env = process.env.NODE_ENV;
    process.env.NODE_ENV = 'test';
    expect(() => { return new CloudApi({ keyId, key, log }); }).to.not.throw();
    process.env.NODE_ENV = env;
  });

  it('won\'t throw when there is a token', () => {
    expect(() => { return new CloudApi({ keyId, key, log, token: 'blah' }); }).to.not.throw();
  });

  describe('fetch', () => {
    it('returns GET responses', async () => {
      const cloudapi = new CloudApi({ keyId, key, log, token: 'blah' });
      StandIn.replaceOnce(cloudapi._wreck, 'get', (stand) => {
        return {
          res: {},
          payload: {
            foo: 'bar'
          }
        };
      });

      const results = await cloudapi.fetch('/test');
      expect(results).to.equal({foo: 'bar'});
    });
  });
});
