'use strict';


const fromVlan = (vlan) => {
  return {
    id: vlan.vlan_id,
    name: vlan.name,
    description: vlan.description
  };
};

exports.vlan = async (fetch, { id }) => {
  const vlan = await fetch(`/fabrics/default/vlans/${id}`);
  return fromVlan(vlan);
};

exports.vlans = async (fetch, { id }) => {
  if (id) {
    const vlan = await exports.vlan(fetch, { id });
    return [vlan];
  }

  const vlans = await fetch('/fabrics/default/vlans');
  return vlans.map(fromVlan);
};

exports.createVLAN = async (fetch, { id, name, description }) => {
  const payload = {
    vlan_id: id,
    name,
    description
  };

  const vlan = await fetch('/fabrics/default/vlans', { method: 'post', payload });
  return fromVlan(vlan);
};

exports.updateVLAN = async (fetch, { id, name, description }) => {
  const payload = {
    name,
    description
  };

  const vlan = await fetch(`/fabrics/default/vlans/${id}`, { method: 'put', payload });
  return fromVlan(vlan);
};

exports.deleteVLAN = async (fetch, { id }) => {
  const vlan = await exports.vlan(fetch, { id });
  await fetch(`/fabrics/default/vlans/${id}`, { method: 'delete' });
  return vlan;
};

exports.network = (fetch, { id, vlan }) => {
  if (vlan !== undefined) {
    return fetch(`/fabrics/default/vlans/${vlan}/networks/${id}`);
  }

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

exports.createNetwork = (fetch, { vlan, ...payload }) => {
  return fetch(`/fabrics/default/vlans/${vlan}`, { method: 'post', payload });
};

exports.deleteNetwork = async (fetch, { vlan, id }) => {
  const network = await exports.network(fetch, { vlan, id });
  await fetch(`/fabrics/default/vlans/${vlan}/networks/${id}`, { method: 'delete' });
  return network;
};
