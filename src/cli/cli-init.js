#! /usr/bin/env node

import { createPath } from '../utils';

const program = require('commander');

const EntryPoint = require('../index.js');
const packageInfo = require('../../package.json');


const entryPoint = new EntryPoint({ isCLI: true });

program
  .option('block [path]', 'Intialize new block; uses current working directory if path is not supplied')
  .option('handler [path]', 'Intialize new event handler;uses current working directory if path is not supplied. alias: event-handler')
  .version(packageInfo.version)
  .parse(process.argv);

const operation = program.rawArgs[2];

if (!operation) process.exit(1);

if (operation === 'block') {
  entryPoint.init.block({ folderPath: createPath(program.rawArgs[3]) });
} else if (operation === 'handler' || operation === 'event-handler') {
  entryPoint.init.handler({ folderPath: createPath(program.rawArgs[3]) });
} else {
  entryPoint.logger.error('operation not recognized');
}
