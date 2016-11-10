#! /usr/bin/env node
const path = require('path');
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
  let folderPath = null;

  if (program.rawArgs[3]) {
    if (path.isAbsolute(program.rawArgs[3])) {
      folderPath = program.rawArgs[3];
    } else {
      path.join(process.cwd(), program.rawArgs[3]);
    }
  } else {
    folderPath = path.join(process.cwd(), '.');
  }

  entryPoint.init.block({ folderPath });
} else if (operation === 'handler' || operation === 'event-handler') {
  console.log('handler!');
} else {
  entryPoint.logger.error('operation not recognized');
}
