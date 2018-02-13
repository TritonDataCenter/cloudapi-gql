'use strict';

const Sentiment = require('sentiment');
const Adjectives = require('./adjectives.json');
const Names = require('./names.json');


const internals = {
  randomName: () => {
    const index = Math.floor(Math.random() * Names.length);
    return Names[index];
  },
  randomAdjective: () => {
    const index = Math.floor(Math.random() * Adjectives.length);
    return Adjectives[index];
  },
  safeName: () => {
    const name = internals.randomName();
    const adjective = internals.randomAdjective();

    const str = `${adjective} ${name}`;
    if (Sentiment(str).score < 0) {
      return internals.safeName();
    }

    return str.replace(' ', '-');
  }
};


exports.rndName = async (request, h) => {
  const name = internals.safeName();

  const machinesList = await request.plugins.cloudapi.fetch('/machines', { query: { name } }, request);

  if (machinesList.length) {
    return exports.rndName(request, h);
  }

  return name;
};

exports.rndImageName = async (request, h) => {
  const name = internals.safeName();

  const imagesList = await request.plugins.cloudapi.fetch('/images', { query: { name } }, request);

  if (imagesList.length) {
    return exports.rndImageName(request, h);
  }

  return name;
};
