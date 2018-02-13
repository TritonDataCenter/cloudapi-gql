'use strict';

const products = (cloudapiUrl = '/') => {
  const products = [{
    name: 'VMs & Containers',
    description: 'Run VMs and bare metal containers',
    category: 'compute'
  },
  {
    name: 'Converged Analytics',
    description: 'Map reduce and ETL on your objects',
    category: 'compute'
  },
  {
    name: 'VLANs',
    description: 'Wire your appliction your way',
    category: 'network'
  },
  {
    name: 'Subnets',
    description: 'A network for everything',
    category: 'network'
  },
  {
    name: 'Firewall Rules',
    description: 'Control the bits coming and going',
    category: 'network'
  },
  {
    name: 'Service Status',
    description: 'Write here about Service Status',
    category: 'help-support'
  },
  {
    name: 'Contact Support',
    description: 'Chat to us via phone or email',
    category: 'help-support'
  },
  {
    name: 'Support Plans',
    description: 'Write here about Support Plans',
    category: 'help-support'
  },
  {
    name: 'Getting Started',
    description: 'Write here about Getting Started',
    category: 'help-support'
  },
  {
    name: 'Triton Object Storage',
    description: 'Modern cloud object storage',
    category: 'storage'
  },
  {
    name: 'S3 Compatibility Bridge',
    description: 'Modern storage, legacy compatibility',
    category: 'storage'
  },
  {
    name: 'Triton Volumes',
    description: 'Network filesystems for your apps',
    category: 'storage'
  },
  {
    name: 'Role Based Access Control',
    description: 'Manage users within your account',
    category: 'access'
  },
  {
    name: 'Firewall Rules',
    description: 'Inspect all the bytes',
    category: 'access'
  }];

  return products.map((product) => {
    product.tags = product.tags || [];
    product.url = product.url || cloudapiUrl;
    return product;
  });
};

exports.products = () => {
  return products();
};
