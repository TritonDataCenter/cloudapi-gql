'use strict';

const CloudApi = require('./cloudapi');


// const aperture = require('aperture');
// const { config } = require('aperture-config');
//
// const parser = aperture.createParser({
//   types: aperture.types,
//   typeTable: config.typeTable
// });
// .then(policies =>
//   policies.map(({ rules, ...policy }) =>
//     Object.assign(policy, {
//       rules: Object.assign(rules.map(parser.parse.bind(parser)), {
//         str: rule
//       })
//     })
//   )
// );

module.exports.list = () => { return request('listPolicies'); };
module.exports.get = (ctx) => { return request('getPolicy', ctx); };
module.exports.create = (ctx) => { return request('createPolicy', ctx); };
module.exports.update = (ctx) => { return request('updatePolicy', ctx); };
module.exports.destroy = (ctx) => { return request('deletePolicy', ctx); };
