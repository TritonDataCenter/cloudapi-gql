'use strict';

const { expect } = require('code');
const Lab = require('lab');
const { products } = require('../lib/handlers');


const lab = exports.lab = Lab.script();
const { it, describe } = lab;


describe('products()', () => {
  it('returns a list of available products with the default URL', () => {
    const productList = products();
    expect(productList.length).to.be.greaterThan(1);
    expect(productList[0].tags).to.equal([]);
    expect(productList[0].url).to.equal('/');
  });

  it('returns a list of available products with the given URL', () => {
    const productList = products('/test/api');
    expect(productList.length).to.be.greaterThan(1);
    expect(productList[0].tags).to.equal([]);
    expect(productList[0].url).to.equal('/test/api');
  });
});
