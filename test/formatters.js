'use strict';

const { expect } = require('code');
const Lab = require('lab');
const TestDouble = require('testdouble');


const lab = exports.lab = Lab.script();
const { describe, it, afterEach, beforeEach } = lab;

const request = {
  plugins: {
    cloudapi: {}
  }
};


describe('formatters', () => {
  let Handlers;
  // let fetch;
  let Formatters;
  beforeEach(() => {
    Handlers = TestDouble.replace('../lib/handlers', {
      network: TestDouble.func('network')
    });
    // fetch = TestDouble.func('fetch');
    request.plugins.cloudapi.fetch = () => {};
    Formatters = require('../lib/formatters');
  });

  afterEach(() => {
    TestDouble.reset();
  });

  it('does the thing', async () => {
    TestDouble.when(Handlers.network(TestDouble.matchers.anything(), TestDouble.matchers.anything())).thenResolve('it did a thing');
    const res = await Formatters.NIC.network({ network: '123' }, null, request);
    expect(res).to.equal('it did a thing');
  });

  it('can change the image os property value to upper-case', () => {
    const result = Formatters.Image.os({ os: 'bacon' });
    expect(result).to.equal('BACON');
  });

  it('can handle null os image property', () => {
    const result = Formatters.Image.os({ os: null });
    expect(result).to.equal(null);
  });

  it('can change the image state property value to upper-case', () => {
    const result = Formatters.Image.state({ state: 'crispy' });
    expect(result).to.equal('CRISPY');
  });

  it('can handle null state image property', () => {
    const result = Formatters.Image.state({ state: null });
    expect(result).to.equal(null);
  });

  it('can change the image type property value to upper-case and replaces dashes with underscores', () => {
    const result = Formatters.Image.type({ type: 'salisbury-steak' });
    expect(result).to.equal('SALISBURY_STEAK');
  });

  it('can handle null type image property', () => {
    const result = Formatters.Image.type({ type: null });
    expect(result).to.equal(null);
  });

  it('can change action parameters to keyvalue array', () => {
    const result = Formatters.Action.parameters({ parameters: { bacon: 'crispy'} });
    expect(result.length).to.equal(1);
    expect(result[0]).to.contain({name: 'bacon', value: 'crispy'});
  });

  it('can change the caller type property value to upper-case', () => {
    const result = Formatters.Caller.type({ type: 'beef-jerky' });
    expect(result).to.equal('BEEF-JERKY');
  });

  it('can handle null type caller property', () => {
    const result = Formatters.Caller.type({ type: null });
    expect(result).to.equal(null);
  });

  it('can return Caller.keyId', () => {
    const result = Formatters.Caller.key_id({ keyId: '42' });
    expect(result).to.equal('42');
  });

  it('can change the Snapshot.state value to upper-case', () => {
    const result = Formatters.Snapshot.state({ state: 'crispy' });
    expect(result).to.equal('CRISPY');
  });

  it('can handle null Snapshot.state property', () => {
    const result = Formatters.Snapshot.state({ state: null });
    expect(result).to.equal(null);
  });

  it('can change the Snapshot.id value to what', () => {
    const result = Formatters.Snapshot.id({ name: '12345' });
    expect(result).to.equal('3627909a29c31381a071ec27f7c9ca97726182aed29a7ddd2e54353322cfb30abb9e3a6df2ac2c20fe23436311d678564d0c8d305930575f60e2d3d048184d79');
  });

  it('can change the ImageError.code value to upper-case', () => {
    const result = Formatters.ImageError.code({ code: 'crispy' });
    expect(result).to.equal('CRISPY');
  });

  it('can handle null ImageError.state property', () => {
    const result = Formatters.ImageError.code({ code: null });
    expect(result).to.equal(null);
  });

  it('can change the ImageFile.compression value to upper-case', () => {
    const result = Formatters.ImageFile.compression({ compression: 'crispy' });
    expect(result).to.equal('CRISPY');
  });

  it('can handle null ImageFile.compression property', () => {
    const result = Formatters.ImageFile.compression({ compression: null });
    expect(result).to.equal(null);
  });

  it('can return empty array when network machines fabrics is null', async () => {
    const result = await Formatters.Network.machines({ fabric: null });
    expect(result).to.exist();
    expect(result.length).to.equal(0);
  });

  it('can return upper case machine brands', () => {
    const result = Formatters.Machine.brand({brand: 'wright'});
    expect(result).to.equal('WRIGHT');
  });

  it('can handle null machine brand', () => {
    const result = Formatters.Machine.brand({ brand: null });
    expect(result).to.be.null();
  });

  it('can return upper case machine state', () => {
    const result = Formatters.Machine.state({ state: 'crispy' });
    expect(result).to.equal('CRISPY');
  });

  it('can handle null machine state', () => {
    const result = Formatters.Machine.state({ state: null });
    expect(result).to.be.null();
  });

  it('can return machine primary_ip to primaryIp', () => {
    const result = Formatters.Machine.primary_ip({ primaryIp: '86.75.30.9' });
    expect(result).to.equal('86.75.30.9');
  });
});
