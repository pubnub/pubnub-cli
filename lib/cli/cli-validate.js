#! /usr/bin/env node
'use strict';

var _utils = require('../utils');

var program = require('commander');

var EntryPoint = require('../index.js');
var packageInfo = require('../../package.json');

var entryPoint = new EntryPoint({ isCLI: true });

program.option('[path]', 'Check to validate that the block is valid').version(packageInfo.version).parse(process.argv);

entryPoint.validate({ folderPath: (0, _utils.createPath)(program.rawArgs[2]) });
//# sourceMappingURL=cli-validate.js.map
