System.register(["fs", "path", "colors", "lodash", "inquirer", "../utils"], function (exports_1, context_1) {
    "use strict";
    var __moduleName = context_1 && context_1.id;
    var fs_1, path_1, colors_1, lodash_1, inquirer_1, utils_1, VERSION, InitComponent;
    return {
        setters: [
            function (fs_1_1) {
                fs_1 = fs_1_1;
            },
            function (path_1_1) {
                path_1 = path_1_1;
            },
            function (colors_1_1) {
                colors_1 = colors_1_1;
            },
            function (lodash_1_1) {
                lodash_1 = lodash_1_1;
            },
            function (inquirer_1_1) {
                inquirer_1 = inquirer_1_1;
            },
            function (utils_1_1) {
                utils_1 = utils_1_1;
            }
        ],
        execute: function () {
            VERSION = 1;
            InitComponent = class InitComponent {
                constructor({ logger, networking, interactive = false }) {
                    this.logger = logger;
                    this.networking = networking;
                    this.interactive = interactive;
                    this.blockManifestFile = 'block.json';
                }
                createBlock({ folderPath }) {
                    if (!this.interactive) {
                        this.logger.error('#createBlock not supported for non-interactive mode');
                        return;
                    }
                    let existingManifest = null;
                    try {
                        existingManifest = fs_1.default.readFileSync(path_1.default.join(folderPath, this.blockManifestFile), 'utf-8');
                    }
                    catch (e) {
                    }
                    if (existingManifest !== null) {
                        this.logger.error(colors_1.default.red(this.blockManifestFile + 'already exists. aborting initalization'));
                        return;
                    }
                    const inputParams = [
                        {
                            field: null,
                            name: 'name',
                            message: 'Please enter the BLOCK name',
                            type: 'input',
                            default: lodash_1.default.kebabCase(path_1.default.basename(folderPath))
                        },
                        {
                            field: null,
                            name: 'description',
                            message: 'Please enter the BLOCK description',
                            type: 'input'
                        },
                        {
                            field: null,
                            name: 'license',
                            message: 'Please enter the license type',
                            type: 'input',
                            default: 'ISC'
                        },
                        {
                            field: null,
                            name: 'version',
                            message: 'Please enter the inital version',
                            type: 'input',
                            default: '1.0.0'
                        }
                    ];
                    utils_1.abstractedValidator(inputParams, this.interactive).then((fields) => {
                        this.logger.info('About to create the following ' + this.blockManifestFile + ' file \n' + JSON.stringify(fields, null, '\t'));
                        inquirer_1.default.prompt({ type: 'boolean', name: 'okayToWrite', default: true, message: 'Good to write to file system?' }).then((result) => {
                            if (result.okayToWrite) {
                                fields.dependencies = {};
                                fields.version = VERSION;
                                fs_1.default.writeFileSync(path_1.default.join(folderPath, this.blockManifestFile), JSON.stringify(fields, null, 4));
                                this.logger.info(this.blockManifestFile + 'file created at: ' + path_1.default.join(folderPath, this.blockManifestFile));
                            }
                        });
                    });
                }
                createEventHandler({ folderPath }) {
                    const srcFolder = path_1.default.join(folderPath, 'src');
                    const templateFolder = path_1.default.join(__dirname, '../../templates');
                    const jsTemplate = fs_1.default.readFileSync(path_1.default.join(templateFolder, 'eh.js'), 'utf8');
                    if (!this.interactive) {
                        this.logger.error('#createEventHandler not supported for non-interactive mode');
                        return;
                    }
                    try {
                        fs_1.default.statSync(srcFolder);
                    }
                    catch (e) {
                        fs_1.default.mkdirSync(srcFolder);
                    }
                    const inputParams = [
                        {
                            field: null,
                            name: 'name',
                            message: 'Please enter the Event Handler name',
                            type: 'input'
                        },
                        {
                            field: null,
                            name: 'type',
                            message: 'Please choose the event handler type',
                            type: 'list',
                            choices: ['Before Publish', 'After Publish', 'After Presence']
                        }
                    ];
                    utils_1.abstractedValidator(inputParams, this.interactive).then((fields) => {
                        const handlerJSON = { name: lodash_1.default.kebabCase(fields.name), type: lodash_1.default.kebabCase(fields.type) };
                        fs_1.default.writeFileSync(path_1.default.join(srcFolder, lodash_1.default.lowerCase(fields.name) + '.json'), JSON.stringify(handlerJSON, null, 4));
                        fs_1.default.writeFileSync(path_1.default.join(srcFolder, lodash_1.default.lowerCase(fields.name) + '.js'), jsTemplate);
                        this.logger.info('Created new event handler.');
                    });
                }
            };
            exports_1("default", InitComponent);
        }
    };
});
//# sourceMappingURL=init.js.map