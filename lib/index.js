System.register(["winston", "fs", "path", "esprima", "./networking", "./components/session", "./components/init", "./components/associate"], function (exports_1, context_1) {
    "use strict";
    var __moduleName = context_1 && context_1.id;
    var winston_1, fs_1, path_1, esprima_1, networking_1, session_1, init_1, associate_1, default_1;
    return {
        setters: [
            function (winston_1_1) {
                winston_1 = winston_1_1;
            },
            function (fs_1_1) {
                fs_1 = fs_1_1;
            },
            function (path_1_1) {
                path_1 = path_1_1;
            },
            function (esprima_1_1) {
                esprima_1 = esprima_1_1;
            },
            function (networking_1_1) {
                networking_1 = networking_1_1;
            },
            function (session_1_1) {
                session_1 = session_1_1;
            },
            function (init_1_1) {
                init_1 = init_1_1;
            },
            function (associate_1_1) {
                associate_1 = associate_1_1;
            }
        ],
        execute: function () {
            default_1 = class {
                constructor({ isCLI = false }) {
                    this.logger = new (winston_1.default.Logger)({
                        transports: [
                            new (winston_1.default.transports.Console)()
                        ]
                    });
                    this.networking = new networking_1.default({ endpoint: 'https://admin.pubnub.com', logger: this.logger });
                    this.init = new init_1.default({ networking: this.networking, logger: this.logger, interactive: isCLI });
                    this.session = new session_1.default({ networking: this.networking, logger: this.logger, interactive: isCLI });
                    this.associate = new associate_1.default({ networking: this.networking, sessionComponent: this.session, logger: this.logger, interactive: isCLI });
                    this.validate = ({ folderPath }) => {
                        const sourceCodeFolder = path_1.default.join(folderPath, 'src');
                        let sourceFolderContents = [];
                        try {
                            sourceFolderContents = fs_1.default.readdirSync(sourceCodeFolder);
                        }
                        catch (e) {
                            this.logger.error('failed to read source folder', e);
                            return;
                        }
                        sourceFolderContents.forEach((sourceFile) => {
                            const sourceCodeLocation = path_1.default.join(sourceCodeFolder, sourceFile);
                            if (path_1.default.extname(sourceCodeLocation) === '.js') {
                                const sourceCodeContents = fs_1.default.readFileSync(sourceCodeLocation);
                                try {
                                    esprima_1.default.parse(sourceCodeContents.toString('UTF-8'), { sourceType: 'module' });
                                    this.logger.info(sourceFile + ' is valid');
                                }
                                catch (e) {
                                    this.logger.error(sourceFile + ' is invalid', e);
                                }
                            }
                        });
                    };
                }
            };
            exports_1("default", default_1);
        }
    };
});
//# sourceMappingURL=index.js.map