'use strict';

const CloudApi = require('./cloudapi');


// lists all networks, including fabric networks
module.exports.list = () => { return request('listNetworks'); };
module.exports.get = ({ id }) => { return request('getNetwork', id); };
// create fabric network
module.exports.create = () => { return request(''); };
// destroy fabric network
module.exports.destroy = () => { return request(''); };
