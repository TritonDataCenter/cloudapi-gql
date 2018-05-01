'use strict';

const { expect } = require('code');
const Lab = require('lab');
const StandIn = require('stand-in');
const CloudApi = require('webconsole-cloudapi-client');
const ServerHelper = require('./helpers');


const lab = exports.lab = Lab.script();
const { describe, it, afterEach } = lab;


describe('images', () => {
  afterEach(() => {
    StandIn.restoreAll();
  });

  const image = {
    id: '2b683a82-a066-11e3-97ab-2faa44701c5a',
    name: 'base',
    version: '13.4.0',
    os: 'smartos',
    requirements: {},
    type: 'zone-dataset',
    description: 'A 32-bit SmartOS image with just essential packages installed. Ideal for users who are comfortable with setting up their own environment and tools.',
    files: [
      {
        compression: 'gzip',
        sha1: '3bebb6ae2cdb26eef20cfb30fdc4a00a059a0b7b',
        size: 110742036
      }
    ],
    tags: {
      role: 'os',
      group: 'base-32'
    },
    homepage: 'https://docs.joyent.com/images/smartos/base',
    published_at: '2014-02-28T10:50:42Z',
    owner: '930896af-bf8c-48d4-885c-6573a94b1853',
    public: true,
    state: 'active'
  };

  it('can get all images', async () => {
    StandIn.replaceOnce(CloudApi.prototype, 'fetch', (stand) => {
      return [image];
    });

    const server = await ServerHelper.getServer();
    const res = await server.inject({
      url: '/graphql',
      method: 'post',
      payload: { query: 'query { images(name: "base") { name os type } }' }
    });
    expect(res.statusCode).to.equal(200);
    expect(res.result.data.images).to.exist();
    expect(res.result.data.images[0].name).to.equal(image.name);
    expect(res.result.data.images[0].os).to.equal(image.os.toUpperCase());
    expect(res.result.data.images[0].type).to.equal(image.type.toUpperCase().replace('-', '_'));
  });

  it('can get all images filtered by id', async () => {
    const server = await ServerHelper.getServer();
    StandIn.replaceOnce(CloudApi.prototype, 'fetch', (stand) => {
      return image;
    });

    const res = await server.inject({
      url: '/graphql',
      method: 'post',
      payload: { query: `query { images(id: "${image.id}") { name os type } }` }
    });
    expect(res.statusCode).to.equal(200);
    expect(res.result.data.images).to.exist();
    expect(res.result.data.images[0].name).to.equal(image.name);
    expect(res.result.data.images[0].os).to.equal(image.os.toUpperCase());
    expect(res.result.data.images[0].type).to.equal(image.type.toUpperCase().replace('-', '_'));
  });

  it('can get a single image', async () => {
    const server = await ServerHelper.getServer();
    StandIn.replaceOnce(CloudApi.prototype, 'fetch', (stand) => {
      return image;
    });

    const res = await server.inject({
      url: '/graphql',
      method: 'post',
      payload: { query: `query { image(id: "${image.id}") { name os type state } }` }
    });
    expect(res.statusCode).to.equal(200);
    expect(res.result.data.image).to.exist();
    expect(res.result.data.image.name).to.equal(image.name);
    expect(res.result.data.image.os).to.equal(image.os.toUpperCase());
    expect(res.result.data.image.type).to.equal(image.type.toUpperCase().replace('-', '_'));
  });

  it('can return error when fetch throws an exception', async () => {
    const server = await ServerHelper.getServer();
    StandIn.replaceOnce(CloudApi.prototype, 'fetch', () => {
      throw Error('it blowed up');
    });

    const res = await server.inject({
      url: '/graphql',
      method: 'post',
      payload: { query: `query { image(id: "${image.id}") { name os type state } }` }
    });
    expect(res.statusCode).to.equal(200);
    expect(res.result.errors).to.exist();
    expect(res.result.data.image).to.not.exist();
  });

  it('can create an image from a machine', async () => {
    const server = await ServerHelper.getServer();
    StandIn.replace(CloudApi.prototype, 'fetch', (stand) => {
      return image;
    }, { stopAfter: 2 });

    const res = await server.inject({
      url: '/graphql',
      method: 'post',
      payload: { query: `mutation {
        createImageFromMachine(machine: "${image.id}", name: "base", version: "13.4.0") {
          name os type version
        }
      }` }
    });
    expect(res.statusCode).to.equal(200);
    expect(res.result.data.createImageFromMachine).to.exist();
    expect(res.result.data.createImageFromMachine.name).to.equal(image.name);
    expect(res.result.data.createImageFromMachine.os).to.equal(image.os.toUpperCase());
    expect(res.result.data.createImageFromMachine.type).to.equal(image.type.toUpperCase().replace('-', '_'));
  });

  it('can update an image', async () => {
    const server = await ServerHelper.getServer();
    StandIn.replace(CloudApi.prototype, 'fetch', (stand) => {
      return image;
    }, { stopAfter: 2 });

    const res = await server.inject({
      url: '/graphql',
      method: 'post',
      payload: { query: `mutation {
        updateImage(id: "${image.id}", name: "base", version: "13.4.0") {
          name os type version
        }
      }` }
    });
    expect(res.statusCode).to.equal(200);
    expect(res.result.data.updateImage).to.exist();
    expect(res.result.data.updateImage.name).to.equal(image.name);
    expect(res.result.data.updateImage.os).to.equal(image.os.toUpperCase());
    expect(res.result.data.updateImage.type).to.equal(image.type.toUpperCase().replace('-', '_'));
  });

  it('can delete an image', async () => {
    const server = await ServerHelper.getServer();
    StandIn.replace(CloudApi.prototype, 'fetch', (stand) => {
      return image;
    }, { stopAfter: 2 });

    const res = await server.inject({
      url: '/graphql',
      method: 'post',
      payload: {
        query: `mutation {
        deleteImage(id: "${image.id}") {
          name os type version
        }
      }` }
    });
    expect(res.statusCode).to.equal(200);
    expect(res.result.data.deleteImage).to.exist();
    expect(res.result.data.deleteImage.name).to.equal(image.name);
    expect(res.result.data.deleteImage.os).to.equal(image.os.toUpperCase());
    expect(res.result.data.deleteImage.type).to.equal(image.type.toUpperCase().replace('-', '_'));
  });

  it('can export an image', async () => {
    const server = await ServerHelper.getServer();
    const mantaLocation = {
      'manta_url': 'https://us-east.manta.joyent.com',
      'image_path': '/test.user/stor/test-image',
      'manifest_path': '/test.user/stor/test-image.imgmanifest'
    };
    StandIn.replace(CloudApi.prototype, 'fetch', (stand) => {
      return mantaLocation;
    }, { stopAfter: 2 });

    const res = await server.inject({
      url: '/graphql',
      method: 'post',
      payload: {
        query: `mutation {
        exportImage(id: "${image.id}", manta_path: "/test.user/stor/test-image") {
          manta_url image_path manifest_path
        }
      }` }
    });
    expect(res.statusCode).to.equal(200);
    expect(res.result.data.exportImage).to.exist();
    expect(res.result.data.exportImage.manta_url).to.equal(mantaLocation.manta_url);
    expect(res.result.data.exportImage.image_path).to.equal(mantaLocation.image_path);
    expect(res.result.data.exportImage.manifest_path).to.equal(mantaLocation.manifest_path);
  });
});
