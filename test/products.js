'use strict';

const Code = require('code');
const Lab = require('lab');
const Products = require('../lib/products');


const lab = exports.lab = Lab.script();
const { it, describe } = lab;
const expect = Code.expect;


describe('products()', () => {
  it('returns a list of available products with the correct URL', () => {
    const products = Products('/test');
    expect(products.length).to.be.greaterThan(1);
    expect(products[0].url).to.contain('/test');
  });
});
