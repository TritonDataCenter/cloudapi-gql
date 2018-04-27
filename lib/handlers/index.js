'use strict';

const Fs = require('fs');


const paths = Fs.readdirSync(__dirname);
for (const path of paths) {
  if (path === 'index.js' || path.indexOf('.json') > -1) {
    continue;
  }

  const handlers = require(`./${path}`);
  const handlerKeys = Object.keys(handlers);
  for (const key of handlerKeys) {
    exports[key] = handlers[key];
  }
}

