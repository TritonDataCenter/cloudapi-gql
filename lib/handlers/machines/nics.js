'use strict';

exports.nic = (fetch, { machine, mac }) => {
  return fetch(`/machines/${machine}/nics/${mac}`);
};

exports.nics = async (fetch, { machine, mac }) => {
  if (mac) {
    const nic = await exports.nic(fetch, { machine, mac });
    return [nic];
  }

  return fetch(`/machines/${machine}/nics`);
};

exports.addNic = (fetch, { machine, network }) => {
  return fetch(`/machines/${machine}/nics`, { method: 'post', payload: { network } });
};

exports.removeNic = async (fetch, { machine, mac }) => {
  const nic = await exports.nic(fetch, { machine, mac });
  await fetch(`/machines/${machine}/nics/${mac}`, { method: 'delete' });
  return nic;
};
