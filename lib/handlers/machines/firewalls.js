'use strict';


exports.enableMachineFirewall = async (fetch, { id }) => {
  const query = {
    action: 'enable_firewall'
  };

  await fetch(`/machines/${id}`, { method: 'post', query });
  return fetch(`/machines/${id}`);
};

exports.disableMachineFirewall = async (fetch, { id }) => {
  const query = {
    action: 'disable_firewall'
  };

  await fetch(`/machines/${id}`, { method: 'post', query });
  return fetch(`/machines/${id}`);
};
