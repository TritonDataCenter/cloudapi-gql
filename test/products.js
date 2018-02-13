'use strict';

const { expect } = require('code');
const Lab = require('lab');
const { products } = require('../lib/handlers');


const lab = exports.lab = Lab.script();
const { it, describe } = lab;


describe('products()', () => {
  it('returns a list of available products with the correct URL', () => {
    expect(products().length).to.be.greaterThan(1);
  });
});
