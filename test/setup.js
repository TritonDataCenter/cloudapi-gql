'use strict';

const Fs = require('fs');
const Path = require('path');
const { expect } = require('code');
const Lab = require('lab');
const CloudApiGql = require('../lib/');
const Setup = require('../lib/setup');

const TestDouble = require('testdouble');
const lab = exports.lab = Lab.script();
const { describe, it, afterEach } = lab;

const register = {
  plugin: CloudApiGql,
  options: {
    keyPath: Path.join(__dirname, 'helpers', 'test.key'),
    keyId: 'test',
    apiBaseUrl: 'http://localhost'
  }
};

const key = Fs.readFileSync(register.options.keyPath);

describe('server setup', () => {
  afterEach(() => {
    TestDouble.reset();
  });

  it('can handle setupCloudApi with token auth config', () => {
    const { keyId, apiBaseUrl } = register.options;
    const auth = {
      credentials: {
        token: 'bacon'
      }
    };
    const log = () => {};
    const cloudApiSetup = Setup.setupCloudApi({ key, keyId, apiBaseUrl });
    const cloudApi = cloudApiSetup({ auth, log });
    expect(cloudApi._token).to.equal('bacon');
  });

  it('can handle setupCloudApi without token autho config', () => {
    const { keyId, apiBaseUrl } = register.options;
    const auth = {};
    const log = () => { };
    const cloudApiSetup = Setup.setupCloudApi({ key, keyId, apiBaseUrl });
    const cloudApi = cloudApiSetup({ auth, log });
    expect(cloudApi._token).to.be.undefined();
  });

  it('can have preResolve return cloudapi when route requires auth', () => {
    const cloudApi = () => { return 'hai'; };
    const request = {
      route: {
        settings: {
          auth: true
        }
      },
      plugins: {},
      log: () => { }
    };
    const res = Setup.preResolve(cloudApi)(null, null, request);
    expect(res).to.equal('hai');
  });

  it('can have preResolve return nothing when route does not requires auth', () => {
    const cloudApi = () => { return 'hai'; };
    const request = {
      route: {
        settings: {
          auth: false
        }
      },
      plugins: {},
      log: () => { }
    };
    const res = Setup.preResolve(cloudApi)(null, null, request);
    expect(res).to.be.undefined();
  });

  it('can have postAuth return request with cloudapi when route requires auth', () => {
    const cloudApi = () => { return 'hai'; };
    const h = { continue: 'yes' };
    const request = {
      route: {
        settings: {
          auth: true
        }
      },
      plugins: {},
      log: () => {}
    };
    const res = Setup.postAuth(cloudApi)(request, h);
    expect(res).to.equal('yes');
    expect(request.plugins.cloudapi).to.exist();
  });

  it('can have postAuth return request without cloudapi when route does not requires auth', () => {
    const cloudApi = () => { return 'hai'; };
    const h = { continue: 'yes' };
    const request = {
      route: {
        settings: {
          auth: false
        }
      },
      plugins: {},
      log: () => { }
    };
    const res = Setup.postAuth(cloudApi)(request, h);
    expect(res).to.equal('yes');
    expect(request.plugins.cloudapi).to.be.undefined();
  });
});


