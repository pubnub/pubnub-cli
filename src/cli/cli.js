#! /usr/bin/env node
import program from 'commander';

import packageInfo from '../../package.json';
import { createPath } from '../utils';
import EntryPoint from '../index';

const entryPoint = new EntryPoint({ isCLI: true });

program
  .version(packageInfo.version)
  .option('associate', 'associate the local block with a remote')
  .command('init [operations]', 'perform intialization operations')
  .command('session [operations]', 'perform operations related to sessions')
  .parse(process.argv);

const operation = program.rawArgs[2];

if (operation === 'associate') {
  entryPoint.associate({ folderPath: createPath(program.rawArgs[3]) });
}
