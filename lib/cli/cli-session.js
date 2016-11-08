#! /usr/bin/env node
'use strict';

var program = require('commander');

var EntryPoint = require('../index.js');
var packageInfo = require('../../package.json');

var entryPoint = new EntryPoint({ isCLI: true });

program.version(packageInfo.version).option('create [email] [password]', 'create session: email & password is optional and can be supplied in runtime.').option('delete', 'delete session: delete the stored credentials if they exist.').parse(process.argv);

var operation = program.rawArgs[2];

if (!operation) process.exit(1);

if (operation === 'create') {
  var email = program.rawArgs[3];
  var password = program.rawArgs[4];
  entryPoint.session.create({ email: email, password: password });
} else if (operation === 'delete') {
  entryPoint.session.delete();
} else if (operation === 'check') {
  entryPoint.session.check();
} else {
  console.log('operation not recognized: ' + operation);
}
//# sourceMappingURL=cli-session.js.map
