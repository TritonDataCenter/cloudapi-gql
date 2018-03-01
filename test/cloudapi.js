'use strict';

const { AssertionError } = require('assert');
const Fs = require('fs');
const Path = require('path');
const { expect } = require('code');
const Lab = require('lab');
const StandIn = require('stand-in');
const CloudApi = require('../lib/cloudapi');


const lab = exports.lab = Lab.script();
const { describe, it } = lab;

describe('cloudapi', () => {
  const key = Fs.readFileSync(Path.join(__dirname, 'test.key'));
  const log = () => {};

  it('throws when missing a token in production', () => {
    const env = process.env.NODE_ENV;
    process.env.NODE_ENV = 'production';
    expect(() => { return new CloudApi({ key, log }); }).to.throw(AssertionError);
    process.env.NODE_ENV = env;
  });

  it('won\'t throw when missing a token in development', () => {
    const env = process.env.NODE_ENV;
    process.env.NODE_ENV = 'development';
    expect(() => { return new CloudApi({ key, log }); }).to.not.throw();
    process.env.NODE_ENV = env;
  });

  it('won\'t throw when missing a token in test', () => {
    const env = process.env.NODE_ENV;
    process.env.NODE_ENV = 'test';
    expect(() => { return new CloudApi({ key, log }); }).to.not.throw();
    process.env.NODE_ENV = env;
  });

  it('won\'t throw when there is a token', () => {
    expect(() => { return new CloudApi({ key, log, token: 'blah' }); }).to.not.throw();
  });

  describe('fetch', () => {
    it('caches GET responses', async () => {
      const cloudapi = new CloudApi({ key, log, token: 'blah' });
      StandIn.replaceOnce(cloudapi._wreck, 'get', (stand) => {
        return {
          res: {},
          payload: {
            foo: 'bar'
          }
        };
      });

      const results1 = await cloudapi.fetch('/test');
      const results2 = await cloudapi.fetch('/test');
      expect(results1.foo).to.equal(results2.foo);
    });
  });
});
