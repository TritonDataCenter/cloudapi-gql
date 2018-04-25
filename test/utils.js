'use strict';

const { expect } = require('code');
const Lab = require('lab');
const Utils = require('../lib/utils');


const lab = exports.lab = Lab.script();
const { describe, it } = lab;

describe('Utils tests', () => {
  describe('toNameValues', () => {
    it('can turn a null into an empty array', () => {
      const res = Utils.toNameValues(null);
      expect(res).to.equal([]);
    });
    it('can turn an object property names into an array', () => {
      const res = Utils.toNameValues({ test1: 1, test2: 2 });
      expect(res).to.be.an.array();
      expect(res.length).to.equal(2);
      expect(res[0].id).to.be.a.string();
      expect(res[0].name).to.be.a.string().and.to.equal('test1');
      expect(res[0].value).to.be.a.number().and.to.equal(1);
    });
  });

  describe('fromNameValues', () => {
    it('can turn a property name array back into an object', () => {
      const value = { test1: 1, test2: 2 };
      const res = Utils.fromNameValues(Utils.toNameValues(value));
      expect(res).to.equal(value);
    });

    it('can turn a property name array back into an object with prefixes', () => {
      const value = { test1: 1, test2: 2 };
      const res = Utils.fromNameValues(Utils.toNameValues(value), 'bacon');
      expect(res).to.equal({ bacontest1: 1, bacontest2: 2 });
    });

    it('it parses triton.cns.disable property as JSON', () => {
      const value = { 'triton.cns.disable': '{"val": true}' };
      const res = Utils.fromNameValues(Utils.toNameValues(value));
      expect(res).to.equal({ 'triton.cns.disable': { val: true } });
    });
  });

  describe('toPage', () => {
    it('turns an empty object into a page of nothing', () => {
      const res = Utils.toPage({});
      expect(res.offset).to.equal(0);
      expect(res.limit).to.equal(0);
      expect(res.results).to.not.exist();
      expect(res.total).to.equal(0);
    });

    it('turns a response and payload into a paged response', () => {
      const res = Utils.toPage(
        {
          res: {
            headers: { 'x-resource-count': 25 }
          },
          payload: [5, 6, 7, 8, 9, 10, 11, 12, 13, 14],
          offset: 5,
          limit: 10
        });
      expect(res.offset).to.equal(5);
      expect(res.limit).to.equal(10);
      expect(res.results).to.equal([5, 6, 7, 8, 9, 10, 11, 12, 13, 14]);
      expect(res.total).to.equal(25);
    });
  });
});
