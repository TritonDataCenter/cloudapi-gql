'use strict';

const { expect } = require('code');
const Lab = require('lab');
const StandIn = require('stand-in');
const CloudApi = require('webconsole-cloudapi-client');
const TestDouble = require('testdouble');
const ServerHelper = require('./helpers');


const lab = exports.lab = Lab.script();
const { describe, it, afterEach } = lab;


describe('random', () => {
  afterEach(() => {
    StandIn.restoreAll();
    TestDouble.reset();
  });

  it('can query for a random machine name', async () => {
    const server = await ServerHelper.getServer();
    StandIn.replaceOnce(CloudApi.prototype, 'fetch', (stand) => {
      return [];
    });

    const res = await server.inject({
      url: '/graphql',
      method: 'post',
      payload: { query: 'query { rndName }' }
    });
    expect(res.statusCode).to.equal(200);
    expect(res.result.data.rndName).to.exist();
  });

  it('can query for a random image', async () => {
    const server = await ServerHelper.getServer();
    StandIn.replaceOnce(CloudApi.prototype, 'fetch', (stand) => {
      return [];
    });

    const res = await server.inject({
      url: '/graphql',
      method: 'post',
      payload: { query: 'query { rndImageName }' }
    });
    expect(res.statusCode).to.equal(200);
    expect(res.result.data.rndImageName).to.exist();
  });

  it('can recursively get a random name', async () => {
    const fetch = TestDouble.func();
    const captor = TestDouble.matchers.captor();
    TestDouble.when(fetch(TestDouble.matchers.anything(), TestDouble.matchers.anything())).thenResolve([]);
    const Sentiment = TestDouble.replace('sentiment');
    TestDouble.when(Sentiment(captor.capture())).thenReturn({ score: -1 }, { score: 1 });
    const Random = require('../lib/handlers/random');
    await Random.rndName(fetch);
    expect(captor.values.length).to.equal(2);
  });

  it('can recursively get a random name if a name matches an existing machine', async () => {
    const fetch = TestDouble.func();
    const machineCaptor = TestDouble.matchers.captor();
    const randomNameCaptor = TestDouble.matchers.captor();
    TestDouble.when(fetch(TestDouble.matchers.anything(), machineCaptor.capture())).thenResolve([{id: 'bacon'}], []);
    const Sentiment = TestDouble.replace('sentiment');
    TestDouble.when(Sentiment(randomNameCaptor.capture())).thenReturn({ score: 1 });
    const Random = require('../lib/handlers/random');
    await Random.rndName(fetch);
    expect(machineCaptor.values.length).to.equal(2);
    expect(randomNameCaptor.values.length).to.equal(2);
  });

  it('can recursively get a random image name if a name matches an existing image', async () => {
    const fetch = TestDouble.func();
    const imageNameCaptor = TestDouble.matchers.captor();
    const randomNameCaptor = TestDouble.matchers.captor();
    TestDouble.when(fetch(TestDouble.matchers.anything(), imageNameCaptor.capture())).thenResolve([{ id: 'bacon' }], []);
    const Sentiment = TestDouble.replace('sentiment');
    TestDouble.when(Sentiment(randomNameCaptor.capture())).thenReturn({ score: 1 });
    const Random = require('../lib/handlers/random');
    await Random.rndImageName(fetch);
    expect(imageNameCaptor.values.length).to.equal(2);
    expect(randomNameCaptor.values.length).to.equal(2);
  });
});
