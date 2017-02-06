#! /usr/bin/env node

import { createPath } from '../utils';

const program = require('commander');

const EntryPoint = require('../index.js');
const packageInfo = require('../../package.json');


const entryPoint = new EntryPoint({ isCLI: true });

program
  .option('[path]', 'Check to validate that the block is valid')
  .version(packageInfo.version)
  .parse(process.argv);

entryPoint.validate({ folderPath: createPath(program.rawArgs[2]) });
