'use strict';


exports.packages = async (fetch, { id, name, ...query }) => {
  if (id || name) {
    const pkg = await exports.package(fetch, { id, name });
    return [pkg];
  }

  return fetch('/packages', { query });
};

exports.package = (fetch, { id, name}) => {
  return fetch(`/packages/${id || name}`);
};
