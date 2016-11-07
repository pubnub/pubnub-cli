#! /usr/bin/env node
const program = require('commander');

const EntryPoint = require('../index.js');
const packageInfo = require('../../package.json');

const entryPoint = new EntryPoint({ isCLI: true });

program
  .version(packageInfo.version)
  .option('create [email] [password]', 'create session: email & password is optional and can be supplied in runtime.')
  .parse(process.argv);

const operation = program.rawArgs[2];

if (!operation) process.exit(1);

if (operation === 'create') {
  const email = program.rawArgs[3];
  const password = program.rawArgs[4];
  entryPoint.session.create({ email, password });
}

if (operation === 'delete') {
  entryPoint.session.delete();
}
