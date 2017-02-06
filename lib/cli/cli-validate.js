#! /usr/bin/env node
System.register(["../utils"], function (exports_1, context_1) {
    "use strict";
    var __moduleName = context_1 && context_1.id;
    var utils_1, program, EntryPoint, packageInfo, entryPoint;
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
                .option('[path]', 'Check to validate that the block is valid')
                .version(packageInfo.version)
                .parse(process.argv);
            entryPoint.validate({ folderPath: utils_1.createPath(program.rawArgs[2]) });
        }
    };
});
//# sourceMappingURL=cli-validate.js.map