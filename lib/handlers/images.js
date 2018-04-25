'use strict';

const Utils = require('../utils');


exports.image = async (fetch, { brand, id }) => {
  try {
    const { tags, ...image } = await fetch(`/images/${id}`);
    return Object.assign(image, { tags: Utils.toNameValues(tags) });
  } catch (ex) {
    if (brand === 'lx') {
      return {};
    }

    throw ex;
  }
};

exports.images = async (fetch, { id, type = '', os = '', state = 'ACTIVE', ...args }) => {
  if (id) {
    const image = await fetch(`/images/${id}`);
    return [Object.assign(image, { tags: Utils.toNameValues(image.tags) })];
  }

  const query = {
    ...args,
    type: type.toLowerCase(),
    os: os.toLowerCase(),
    state: state.toLowerCase()
  };

  const images = await fetch('/images', { query });

  return images.map(({ tags, ...image}) => {
    return Object.assign(image, {
      tags: Utils.toNameValues(tags)
    });
  });
};

exports.createImageFromMachine = async (fetch, { tags, ...image }) => {
  const payload = {
    ...image,
    tags: Utils.fromNameValues(tags)
  };

  const { id } = await fetch('/images', { method: 'post', payload });
  return exports.image(fetch, { id });
};

exports.updateImage = async (fetch, { id, tags, ...image }) => {
  const payload = {
    ...image,
    tags: Utils.fromNameValues(tags)
  };

  await fetch(`/images/${id}?action=update`, { method: 'post', payload });
  return exports.image(fetch, { id });
};

exports.deleteImage = async (fetch, { id }) => {
  const image = await exports.image(fetch, { id });
  await fetch(`/images/${id}`, { method: 'delete' });
  return image;
};

exports.exportImage = async (fetch, { id, manta_path }) => {
  const query = {
    action: 'export',
    manta_path
  };

  const location = await fetch(`/images/${id}`, { method: 'post', query });
  return location;
};
