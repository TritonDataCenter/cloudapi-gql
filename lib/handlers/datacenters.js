'use strict';


const internals = {
  placeMap: {
    ap: 'Asia',
    us: 'Americas',
    eu: 'Europe'
  }
};

exports.datacenter = async (fetch, { name }, { server: { plugins: { 'cloudapi-gql': { options: { dcName } } } } }) => {
  dcName = name || dcName;
  const { res } = await fetch(`/datacenter/${dcName}`, { includeRes: true });

  return {
    name: dcName,
    place: internals.dataCenterPlace(dcName),
    url: res.headers.Location
  };
};

exports.datacenters = async (fetch) => {
  const datacenters = await fetch('/datacenters');

  return Object.keys(datacenters).map((name) => {
    return {
      name,
      place: internals.dataCenterPlace(name),
      url: datacenters[name]
    };
  });
};


internals.dataCenterPlace = (name) => {
  const nameParts = name.split('-');
  const firstPart = nameParts[0];

  return internals.placeMap[firstPart] || 'Unknown';
};
