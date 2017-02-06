System.register(["os", "fs", "colors", "lodash", "../utils"], function (exports_1, context_1) {
    "use strict";
    var __moduleName = context_1 && context_1.id;
    var os_1, fs_1, colors_1, lodash_1, utils_1, SessionComponent;
    return {
        setters: [
            function (os_1_1) {
                os_1 = os_1_1;
            },
            function (fs_1_1) {
                fs_1 = fs_1_1;
            },
            function (colors_1_1) {
                colors_1 = colors_1_1;
            },
            function (lodash_1_1) {
                lodash_1 = lodash_1_1;
            },
            function (utils_1_1) {
                utils_1 = utils_1_1;
            }
        ],
        execute: function () {
            SessionComponent = class SessionComponent {
                constructor({ logger, networking, interactive = false }) {
                    this.logger = logger;
                    this.networking = networking;
                    this.sessionStorage = os_1.default.homedir() + '/.pubnub-cli';
                    this.interactive = interactive;
                }
                checkSession({ userId, sessionToken } = {}) {
                    const abstractedPromise = utils_1.createPromise();
                    new Promise((fulfill) => {
                        if (this.interactive) {
                            this._fetchSessionFile()
                                .then((credentials) => { fulfill(credentials); })
                                .catch((error) => {
                                this.logger.info('Session does not exist; credentials found failed to load', error);
                                return;
                            });
                        }
                        else {
                            fulfill({ userId, sessionToken });
                        }
                    }).then((credentials) => {
                        this.networking.getApps({ sessionToken: credentials.sessionToken, ownerId: credentials.userId }, (err, result) => {
                            if (this.interactive) {
                                if (result)
                                    this.logger.info(colors_1.default.green('session is valid'));
                                else
                                    this.logger.info(colors_1.default.red('session is invalid'));
                            }
                            abstractedPromise.resolve({ sessionValid: result !== undefined, sessionToken: credentials.sessionToken, userId: credentials.userId });
                        });
                    }).catch((error) => {
                        if (this.interactive)
                            this.logger.error(error);
                        return abstractedPromise.reject(error);
                    });
                    return abstractedPromise.promise;
                }
                validateOrCreateSession() {
                    const abstractedPromise = utils_1.createPromise();
                    this.checkSession()
                        .then((result) => {
                        if (result.sessionValid) {
                            abstractedPromise.resolve(lodash_1.default.pick(result, 'sessionToken', 'ownerId'));
                        }
                        else {
                            this.createSession()
                                .then((response) => {
                                abstractedPromise.resolve(lodash_1.default.pick(response, 'sessionToken', 'ownerId'));
                            })
                                .catch((err) => {
                                abstractedPromise.reject(err);
                            });
                        }
                    })
                        .catch((error) => {
                        this.logger.error(error);
                        abstractedPromise.reject(error);
                    });
                    return abstractedPromise.promise;
                }
                createSession({ email, password } = {}) {
                    const abstractedPromise = utils_1.createPromise();
                    const inputParams = [
                        {
                            field: email,
                            name: 'email',
                            question: 'Please enter your PubNub email',
                            type: 'input'
                        },
                        {
                            field: password,
                            name: 'password',
                            question: 'Please enter your PubNub password',
                            type: 'password'
                        }
                    ];
                    utils_1.abstractedValidator(inputParams, this.interactive).then((fields) => {
                        this.networking.createLoginToken({ email: fields.email, password: fields.password }, (err, serverResponse) => {
                            if (err) {
                                if (this.interactive)
                                    this.logger.error(err);
                                return abstractedPromise.reject(err);
                            }
                            const userId = serverResponse.result.user_id;
                            const sessionToken = serverResponse.result.token;
                            if (this.interactive) {
                                this.createSessionFile({ userId, sessionToken }).then(() => {
                                    this.logger.info('Login Succesful, token: ' + sessionToken + ' saved to home directory');
                                });
                            }
                            abstractedPromise.resolve({ sessionToken, userId });
                        });
                    }).catch((err) => {
                        if (this.interactive)
                            this.logger.error(err);
                        return abstractedPromise.reject(err);
                    });
                    return abstractedPromise.promise;
                }
                deleteSession() {
                    return this.deleteSessionFile().then(() => {
                        if (this.interactive)
                            this.logger.info('PubNub Session Deleted');
                    });
                }
                _fetchSessionFile() {
                    return new Promise((resolve) => {
                        fs_1.default.readFile(this.sessionStorage, 'utf8', (err, data) => {
                            if (err)
                                resolve({});
                            else
                                resolve(JSON.parse(data));
                        });
                    });
                }
                createSessionFile({ sessionToken, userId }) {
                    return this.deleteSessionFile().then(() => {
                        return new Promise((resolve, reject) => {
                            fs_1.default.writeFile(this.sessionStorage, JSON.stringify({ sessionToken, userId }), (err) => {
                                if (err)
                                    reject(err);
                                else
                                    resolve();
                            });
                        });
                    });
                }
                deleteSessionFile() {
                    return new Promise((resolve, reject) => {
                        fs_1.default.unlink(this.sessionStorage, (err) => {
                            if (err && err.code !== 'ENOENT')
                                reject(err);
                            else
                                resolve();
                        });
                    });
                }
            };
            exports_1("default", SessionComponent);
        }
    };
});
//# sourceMappingURL=session.js.map