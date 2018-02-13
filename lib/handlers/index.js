'use strict';

const Fs = require('fs');


const paths = Fs.readdirSync(__dirname);
for (const path of paths) {
  if (path.indexOf('.') === 0 || path === 'index.js') {
    continue;
  }

  const handlers = require(`./${path}`);
  const handlerKeys = Object.keys(handlers);
  for (const key of handlerKeys) {
    exports[key] = handlers[key];
  }
}

