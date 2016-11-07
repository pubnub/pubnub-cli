#! /usr/bin/env node
const program = require('commander');

const packageInfo = require('../../package.json');

program
  .version(packageInfo.version)
  .command('session [operations]', 'perform operations related to sessions')
  .parse(process.argv);
