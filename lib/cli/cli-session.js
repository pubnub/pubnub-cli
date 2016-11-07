#! /usr/bin/env node
'use strict';

var program = require('commander');

var EntryPoint = require('../index.js');
var packageInfo = require('../../package.json');

var entryPoint = new EntryPoint({ isCLI: true });

program.version(packageInfo.version).option('create [username] [password]', 'create session, password is optional and can be supplied in runtime.').parse(process.argv);

var operation = program.rawArgs[2];

if (!operation) process.exit(1);

if (operation === 'create') {
  var username = program.rawArgs[3];
  var password = program.rawArgs[4];
  entryPoint.session.create({ username: username, password: password });
}

if (operation === 'delete') {
  entryPoint.session.delete();
}
//# sourceMappingURL=cli-session.js.map
