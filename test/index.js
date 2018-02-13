'use strict';

const Path = require('path');
const Hapi = require('hapi');
const Lab = require('lab');
const CloudApiGql = require('../lib/');


const lab = exports.lab = Lab.script();
const it = lab.it;


it('can be registered with hapi', async () => {
  const server = new Hapi.Server();
  await server.register({ plugin: CloudApiGql, options: { keyPath: Path.join(__dirname, 'test.key') } });
});
