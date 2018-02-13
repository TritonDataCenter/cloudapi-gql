'use strict';


exports.vlan = (fetch, { id }) => {
  return fetch(`/fabrics/default/vlans/${id}`);
};

exports.vlans = async (fetch, { id }) => {
  if (id) {
    const vlan = await exports.vlan(fetch, { id });
    return [vlan];
  }

  return fetch('/fabrics/default/vlans');
};


exports.network = (fetch, { id }) => {
  return fetch(`/networks/${id}`);
};

exports.networks = async (fetch, { id, vlan }) => {
  if (id) {
    const network = await exports.network(fetch, { id });
    return [network];
  }

  if (vlan) {
    return fetch(`/fabrics/default/vlans/${vlan}/networks`);
  }

  return fetch('/networks');
};
