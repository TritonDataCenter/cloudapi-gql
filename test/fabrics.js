'use strict';

const Path = require('path');
const { expect } = require('code');
const Hapi = require('hapi');
const Lab = require('lab');
const StandIn = require('stand-in');
const CloudApiGql = require('../lib/');
const CloudApi = require('../lib/cloudapi');


const lab = exports.lab = Lab.script();
const { describe, it } = lab;


describe('machines', () => {
  const network = {
    id: '7326787b-8039-436c-a533-5038f7280f04',
    name: 'default',
    public: false,
    fabric: true,
    gateway: '192.168.128.1',
    internet_nat: true,
    provision_end_ip: '192.168.131.250',
    provision_start_ip: '192.168.128.5',
    resolvers: [
      '8.8.8.8',
      '8.8.4.4'
    ],
    subnet: '192.168.128.0/22',
    vlan_id: 2
  };

  it('can get all networks', async () => {
    const server = new Hapi.Server();
    StandIn.replaceOnce(CloudApi.prototype, 'fetch', (stand) => {
      return [network];
    });

    await server.register({ plugin: CloudApiGql, options: { keyPath: Path.join(__dirname, 'test.key') } });
    await server.initialize();
    const res = await server.inject({
      url: '/graphql',
      method: 'post',
      payload: { query: 'query { networks { id name } }' }
    });
    expect(res.statusCode).to.equal(200);
    expect(res.result.data.networks).to.exist();
    expect(res.result.data.networks[0].id).to.equal(network.id);
    expect(res.result.data.networks[0].name).to.equal(network.name);
  });
});
