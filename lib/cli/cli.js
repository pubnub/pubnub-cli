#! /usr/bin/env node
'use strict';

var program = require('commander');

var packageInfo = require('../../package.json');

program.version(packageInfo.version).command('session [operations]', 'perform operations related to sessions').parse(process.argv);
//# sourceMappingURL=cli.js.map
