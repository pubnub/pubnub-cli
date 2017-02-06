#! /usr/bin/env node
System.register(["../utils"], function (exports_1, context_1) {
    "use strict";
    var __moduleName = context_1 && context_1.id;
    var utils_1, program, EntryPoint, packageInfo, entryPoint, operation;
    return {
        setters: [
            function (utils_1_1) {
                utils_1 = utils_1_1;
            }
        ],
        execute: function () {
            program = require('commander');
            EntryPoint = require('../index.js');
            packageInfo = require('../../package.json');
            entryPoint = new EntryPoint({ isCLI: true });
            program
                .option('block [path]', 'Intialize new block; uses current working directory if path is not supplied')
                .option('handler [path]', 'Intialize new event handler;uses current working directory if path is not supplied. alias: event-handler')
                .version(packageInfo.version)
                .parse(process.argv);
            operation = program.args[2];
            if (!operation) {
                entryPoint.logger.error('operation not recognized');
                process.exit(1);
            }
            if (operation === 'block') {
                entryPoint.init.block({ folderPath: utils_1.createPath(program.rawArgs[3]) });
            }
            else if (operation === 'handler' || operation === 'event-handler') {
                entryPoint.init.handler({ folderPath: utils_1.createPath(program.rawArgs[3]) });
            }
            else {
                entryPoint.logger.error('operation not recognized');
            }
        }
    };
});
//# sourceMappingURL=cli-init.js.map