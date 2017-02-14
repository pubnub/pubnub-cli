#! /usr/bin/env node
import * as program from 'commander';

import { createPath } from '../utils';
import EntryPoint from '../index';

const { version } = require('../../../package.json');
const entryPoint = new EntryPoint({ isCLI: true });

console.log(version);

program
  .version(version)
  .option('associate', 'associate the local block with a remote')
  .command('init [operations]', 'perform intialization operations')
  .command('session [operations]', 'perform operations related to sessions')
  .command('validate [operations]', 'confirm that block is valid')
  .parse(process.argv);

const operation = program.args[2];

if (operation === 'associate') {
  entryPoint.associate.perform({ folderPath: createPath(program.rawArgs[3]) });
}
