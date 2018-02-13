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

exports.rndName = async (fetch) => {
  const name = internals.safeName();

  const machinesList = await fetch('/machines', { query: { name } });

  if (machinesList.length) {
    return exports.rndName(fetch);
  }

  return name;
};

exports.rndImageName = async (fetch) => {
  const name = internals.safeName();

  const imagesList = await fetch('/images', { query: { name } });

  if (imagesList.length) {
    return exports.rndImageName(fetch);
  }

  return name;
};
