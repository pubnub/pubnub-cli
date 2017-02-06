#! /usr/bin/env node
System.register(["commander", "../../package.json", "../utils", "../index"], function (exports_1, context_1) {
    "use strict";
    var __moduleName = context_1 && context_1.id;
    var commander_1, package_json_1, utils_1, index_1, entryPoint, operation;
    return {
        setters: [
            function (commander_1_1) {
                commander_1 = commander_1_1;
            },
            function (package_json_1_1) {
                package_json_1 = package_json_1_1;
            },
            function (utils_1_1) {
                utils_1 = utils_1_1;
            },
            function (index_1_1) {
                index_1 = index_1_1;
            }
        ],
        execute: function () {
            entryPoint = new index_1.default({ isCLI: true });
            commander_1.default
                .version(package_json_1.default.version)
                .option('associate', 'associate the local block with a remote')
                .command('init [operations]', 'perform intialization operations')
                .command('session [operations]', 'perform operations related to sessions')
                .command('validate [operations]', 'confirm that block is valid')
                .parse(process.argv);
            operation = commander_1.default.args[2];
            if (operation === 'associate') {
                entryPoint.associate.perform({ folderPath: utils_1.createPath(commander_1.default.rawArgs[3]) });
            }
        }
    };
});
//# sourceMappingURL=cli.js.map