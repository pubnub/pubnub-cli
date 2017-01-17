#! /usr/bin/env node
'use strict';

var _utils = require('../utils');

var program = require('commander');

var EntryPoint = require('../index.js');
var packageInfo = require('../../package.json');

var entryPoint = new EntryPoint({ isCLI: true });

program.option('block [path]', 'Intialize new block; uses current working directory if path is not supplied').option('handler [path]', 'Intialize new event handler;uses current working directory if path is not supplied. alias: event-handler').version(packageInfo.version).parse(process.argv);

var operation = program.rawArgs[2];

if (!operation) {
  entryPoint.logger.error('operation not recognized');
  process.exit(1);
}

if (operation === 'block') {
  entryPoint.init.block({ folderPath: (0, _utils.createPath)(program.rawArgs[3]) });
} else if (operation === 'handler' || operation === 'event-handler') {
  entryPoint.init.handler({ folderPath: (0, _utils.createPath)(program.rawArgs[3]) });
} else {
  entryPoint.logger.error('operation not recognized');
}
//# sourceMappingURL=cli-init.js.map
