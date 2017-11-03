'use strict';

const CloudApi = require('./cloudapi');


module.exports = (args, request) => {
  return CloudApi('listDatacenters', args, request);
};
// this method is useless since it only "returns an HTTP redirect to your client, where the datacenter url is in the Location header"
// module.exports.get = ({ name }) => request.fetch(`/:login/datacenters/${name}`);
