#! /usr/bin/env node
"use strict";
const program = require("commander");
const utils_1 = require("../utils");
const index_1 = require("../index");
const { version } = require('../../../package.json');
const entryPoint = new index_1.default({ isCLI: true });
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
    entryPoint.associate.perform({ folderPath: utils_1.createPath(program.rawArgs[3]) });
}
