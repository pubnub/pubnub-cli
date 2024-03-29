require('events').EventEmitter.prototype._maxListeners = 100;

/* global pwd */
var inquirer = require('inquirer'); // interactive mode selection
var cli = require('cli').enable('status'); // Enable cli.ok, cli.error, etc
var os = require('os'); // os level functions
var async = require('async'); // async control flow
var fs = require('fs-extra'); // json support for fs
var PUBNUB = require('pubnub'); // obviously
var slug = require('slug'); // strips characters for friendly file names
var envs = require('./envs'); // location of block environment configs
var watch = require('node-watch'); // watch local files, upload, deploy
var debounce = require('debounce');
var onreqTestStub = require('./lib/test-stubs/on-request-test-stub.js');
var otherTestStub = require('./lib/test-stubs/other-eh-test-stub.js');

require('shelljs/global'); // ability to run shell commands

// cli arguments and commands
cli.parse({
    block: ['b', 'Block ID', 'int'],
    key: ['k', 'Subscribe Key ID', 'int'],
    file: ['f', 'A block file', 'path'],
    email: ['m', 'Email', 'string'],
    insert: [
        'n',
        'Insert Mode. Create new blocks and skip prompts.',
        true,
        false
    ],
    account: ['a', 'Account ID', 'int'],
    password: ['p', 'Password', 'string']
},
[
    'login',
    'logout',
    'restart',
    'start',
    'stop',
    'init',
    'push',
    'pull',
    'watch',
    'log',
    'test'
]);

// sets all file operations relative to the current directory
var workingDir = String(pwd());

// cli function to parse arguments and options
cli.main(function (args, options) {
    const path = require('path');
    options.file = options.file || path.sep;

    // an array of functions to run through in series
    // search for the string 'routes' in your IDE for more info
    var tasks = [];

    // default file location is pwd
    var blockFile = workingDir + options.file + 'block.json';

    // token and user info stored in home directory as this file
    var sessionFile = os.homedir() + path.sep + '.pubnub-cli';

    if (options.insert) {
        cli.info('Warning! Insert option provided.');
        cli.info('Creating new blocks and skipping prompts.');
    }

    // user login questions for inquirer
    var userQuestions = {
        email: {
            name: 'email',
            message: 'PubNub Email:',
            type: 'input',
            validate: function (input) {
                var result = true;

                if (input.indexOf('@') === -1) { // I apologize
                    result = 'Please enter a valid email address.';
                }

                return result;
            }
        },
        password: {
            name: 'password',
            message: 'PubNub Password:',
            type: 'password'
        }
    };

    var self = this;

    // methods in this object are pushed into the ```tasks``` array
    // then those methods are executed in series
    // as the methods execute, they populate properties of this object
    // these properties may be accessed by functions executed later

    self.session = false; // the user session
    self.blockLocal = false; // the local block file
    self.blockRemote = false; // the remove block json object
    self.key = false; // the selected key object
    self.account = false;
    self.eventHandler = false; // the selected event handler object

    self.blockFileRequired = false;

    // specify the required environment
    options.env = 'prod';

    self.env = envs[options.env]; // map the env string to an object

    // pubnub-api is a custom api client for portal related operations
    var api = require('./lib/pubnub-api')({
        debug: true,
        debugLogger: cli.debug,
        endpoint: self.env.host
    });

    if (!self.env) {
        cli.fatal('Invalid environment');
    } else {
        cli.ok('Working with '
            + options.env
            + ' environment at '
            + self.env.host);
    }

    // this merges a remote event handler with a local event handler
    var mergeEventHandler = function (input, data) {
        cli.debug('Merging remote event handle with local event handler.');

        input._id = data.id || input._id;
        input.name = data.name || input.name;
        input.event = data.event || input.event;
        input.channels = data.channels || input.channels;
        input.file = input.file || data.file; // local attribute wins
        input.output = data.output || input.output;
        input.path = data.path || input.path; // url path for rest endpoints

        return input;
    };

    // interactive mode of creating/updating/merging an event handler
    var updateEventHandler = function (eventHandler, revise, cb) {
        // questions for inquirer
        var o = {
            name: {
                name: 'name',
                message: 'Name:',
                type: 'input',
                default: eventHandler.name
            },
            event: {
                name: 'event',
                message: 'Event:',
                type: 'list',
                default: eventHandler.event,
                choices: [
                    'js-after-publish',
                    'js-before-publish',
                    'js-after-presence',
                    'js-on-rest'
                ]
            }
        };

        var p = {
            channels: {
                name: 'channels',
                message: 'PubNub Channels:',
                type: 'input',
                default: eventHandler.channels
            },
            output: {
                name: 'output',
                message: 'Output:',
                type: 'input',
                default: eventHandler.output
            }
        };

        var q = {
            path: {
                name: 'path',
                message: 'Path',
                type: 'input',
                default: eventHandler.path
            }
        };

        if (eventHandler.event === 'js-on-rest') {
            Object.assign(o, q); // add path
        } else {
            Object.assign(o, p); // add output and channel
        }

        // if we're missing this property
        // add interactive question to an array
        var qs = [];
        Object.keys(o).forEach(function (key) {
            if (revise || !eventHandler.hasOwnProperty(key)) {
                qs.push(o[key]);
            }
        });

        if (qs.length) {
            // if there are questions, prompt the user
            if (!revise) {
                cli.error(
                    'Event handler '
                    + (eventHandler.name || eventHandler.event || 'Unknown')
                    + ' is missing some information.'
                );
            }

            inquirer.prompt(qs).then(cb);
        } else {
            // otherwise, return
            cb(eventHandler);
        }
    };

    // merges a remote block with what exists on the local filesystem
    var mergeBlock = function (input, data) {
        cli.debug('Merging remote block with local block.');

        input._id = data.id || input._id;
        input._key_id = data.key_id || input._key_id;
        input.name = data.name || input.name;
        input.description = data.description || input.description;

        return input;
    };

    // updates a block object with information from interactive mode
    var updateBlock = function (block, revise, cb) {
        // questions for inquirer
        var o = {
            name: {
                name: 'name',
                message: 'Name:',
                type: 'input',
                default: block.name
            },
            description: {
                name: 'description',
                message: 'Description:',
                type: 'input',
                default: block.description
            }
        };

        // if the block does not have the property
        // add the prompt to a list of questions
        var qs = [];
        Object.keys(o).forEach(function (key) {
            if (revise || !block.hasOwnProperty(key)) {
                qs.push(o[key]);
            }
        });

        if (qs.length) {
            // if we need to prompt, feed the list to interactive mode
            if (!revise) {
                cli.error('Block.json is missing some information.');
            }

            inquirer.prompt(qs).then(cb);
        } else {
            // otherwise just return
            cb(block);
        }
    };

    // update the pubnub-api lib with the local sessions
    var restore = function (session, cb) {
        api.session = session;
        cb(null, session);
    };

    var blockCreate = function (key, cb) {
        updateBlock(self.blockLocal, !options.insert, function (block) {
            block.key_id = key.id;
            block.subscribe_key = key.subscribe_key;
            block.publish_key = key.publish_key;

            api.request(
                'post',
                ['api', 'v1', 'blocks', 'key', key.id, 'block'],
                {
                    body: block
                },
                function (err, data) {
                    cli.ok('Block Created');
                    cb(err ? err.message : null, data.payload);
                }
            );
        });
    };

    var eventHandlerCreate = function (block, cb) {
        updateEventHandler({}, true, function (eh) {
            eh.block_id = block.id;
            eh.key_id = block.key_id;

            eh.type = 'js';
            eh.code = '// code goes here';

            api.request(
                'post',
                ['api', 'v1', 'blocks', 'key', block.key_id, 'event_handler'],
                {
                    body: eh
                },
                function (err) {
                    cli.ok('Event Handler Created');
                    cb(err ? err.message : null);
                }
            );
        });
    };

    // OK: Use this handy command next time:
    // OK: pubnub-cli push -b 1130 -k 145183
    var explain = function () {
        var opts = {};

        // checks for the presence of object properties and informs users
        // that they can use relevant args as a shortcut
        if (self.blockRemote) {
            opts.b = self.blockRemote.id;
        }
        if (self.key) {
            opts.k = self.key.id;
        }
        if (options.file && options.file !== '/') {
            opts.f = options.file;
        }
        if (self.account) {
            opts.a = self.account.id;
        }

        if (Object.keys(opts).length) {
            var hint = 'pubnub-cli ' + cli.command;

            Object.keys(opts).forEach(function (key) {
                hint = hint + ' -' + key + ' ' + opts[key];
            });

            cli.ok('Use this handy command next time:');
            cli.ok(hint);
            // just for Jordan <3
        }
    };

    // restores session from local file
    self.sessionFileGet = function (cb) {
        cli.debug('sessionFileGet');

        // see if session file exists
        cli.info('Reading session from ' + sessionFile);
        fs.readJson(sessionFile, function (err, session) {
            if (err) {
                cb(null);
            } else {
                self.session = session;
                cb(null);
            }
        });
    };

    // deletes the local session file
    self.sessionDelete = function (cb) {
        cli.debug('delete_settings');

        if (!self.session) {
            cli.error('You are not logged in.');
        } else {
            cli.info('Deleting session from ' + sessionFile);
            fs.unlink(sessionFile, function (err) {
                if (err) {
                    cb(err);
                } else {
                    cb();
                }
            });
        }
    };

    // uses the local session file to login
    self.sessionGet = function (cb) {
        cli.debug('get_user');

        var login = function (args2) {
            cli.spinner('Logging In...');

            api.init(args2, function (err, body) {
                cli.spinner('Logging In... Done!', true);

                if (err) {
                    cb(err);
                } else {
                    cli.info('Writing session to ' + sessionFile);
                    fs.outputJson(
                        sessionFile,
                        body.result,
                        { spaces: 4 },
                        function (err2) {
                            self.session = body.result;
                            cb(err2);
                        }
                    );
                }
            });
        };

        if (!self.session) {
            if (cli.command !== 'login') {
                cli.error('No session found, please log in.');
            }

            if (options.email || options.password) {
                if (options.email && options.password) {
                    login(
                        {
                            email: options.email,
                            password: options.password
                        },
                        cb
                    );
                } else {
                    cli.error('You must supply both email'
                        + ' and password to login.');
                }
            } else {
                // no file found, prompt for user and pass
                inquirer
                    .prompt([userQuestions.email, userQuestions.password])
                    .then(function (answers) {
                        login(answers, cb);
                    });
            }
        } else {
            // we have the session file
            if (self.session.expires > new Date().getTime() / 1000) {
                cli.ok('Working as ' + self.session.user.email);

                // token is not expired, tell api to restore
                restore(self.session, cb);
            } else {
                // token expired, need to login again
                cli.error('Session has expired, please login.');
                cli.info('Email ' + self.session.user.email);

                // supply email, prompt password
                inquirer.prompt([userQuestions.password]).then(function (answers) {
                    answers.email = self.session.user.email;
                    login(answers, cb);
                });
            }
        }
    };

    // this is a shortcut to require a block.json is supplied
    self.requireInit = function (cb) {
        self.blockFileRequired = true;
        cb();
    };

    // reads a block.json from wokring dir and sets as self.blockLocal
    self.blockRead = function (cb) {
        cli.debug('blockRead');

        cli.info('Reading block.json from ' + blockFile);
        fs.readJson(blockFile, function (err, data) {
            if (err) {
                if (self.blockFileRequired) {
                    cli.info('No block.json found. Please run pubnub-cli init.');
                } else {
                    cb(null);
                }
            } else {
                if (data.name) {
                    cli.ok('Working on block ' + data.name);
                }

                self.blockLocal = data;
                cb();
            }
        });
    };

    // creates a block.json in working dir
    self.blockFileCreate = function (cb) {
        cli.debug('blockFileCreate');

        cli.info('Checking for block.json in ' + blockFile);
        fs.readJson(blockFile, function (err, data) {
            if (data) {
                cli.info('Block.json already exists.... editing');
                cb();
            } else {
                cli.info('Writing block.json to ' + blockFile);
                fs.outputJson(
                    blockFile,
                    {},
                    {
                        spaces: 4
                    },
                    cb
                );
            }
        });
    };

    // sets self.account
    self.accountGet = function (cb) {
        cli.debug('accountGet');

        // looks first in options
        var givenKey = options.account || false;

        api.request(
            'get',
            ['api', 'accounts'],
            {
                qs: {
                    user_id: self.session.user.id
                }
            },
            function (err, data) {
                // if key is supplied through cli or file
                if (givenKey) {
                    var tempAccount = false;

                    data.result.accounts.forEach(function (value) {
                        if (givenKey === value.id) {
                            tempAccount = value;
                        }
                    });

                    if (!tempAccount) {
                        cb('Invalid account ID');
                    } else {
                        self.account = tempAccount;
                        cb(err);
                    }
                } else {
                    // create an interactive account selection
                    var choices = [];

                    // loop through accounts
                    data.result.accounts.forEach(function (value) {
                        choices.push({
                            name: value.properties.company || value.owner_id,
                            value: value
                        });
                    });

                    if (data.result.accounts.length === 1) {
                        self.account = data.result.accounts[0];
                        cb();
                    } else {
                        cli.ok('Which account?');

                        inquirer
                            .prompt([
                                {
                                    type: 'list',
                                    name: 'account',
                                    message: 'Select an Account',
                                    choices: choices
                                }
                            ])
                            .then(function (answers) {
                                self.account = answers.account;
                                cb(err);
                            });
                    }
                }
            }
        );
    };

    // sets self.key
    self.keyGet = function (cb) {
        cli.debug('keyGet');

        // looks first in options, then in remote block, then local block
        var givenKey = options.key
            || self.blockRemote.key_id
            || self.blockLocal._key_id;

        api.request(
            'get',
            ['api', 'apps'],
            {
                qs: {
                    owner_id: self.account.id
                }
            },
            function (err, data) {
                // if key is supplied through cli or file
                if (givenKey) {
                    // we need to map the key id to the key object
                    var paramKey = false;

                    data.result.forEach(function (app) {
                        app.keys.forEach(function (value) {
                            if (givenKey === value.id) {
                                paramKey = value;
                            }
                        });
                    });

                    if (!paramKey) {
                        cb('Invalid key ID');
                    } else {
                        self.key = paramKey;
                        cb(err);
                    }
                } else {
                    // create an interactive key selection
                    var choices = [];

                    // loop through apps
                    data.result.forEach(function (value) {
                        choices.push(new inquirer.Separator('---'
                            + value.name));

                        // loop through keys in app
                        value.keys.forEach(function (value2) {
                            choices.push({
                                name: value2.properties.name
                                || value2.subscribe_key,
                                value: value2
                            });
                        });
                    });

                    cli.ok('Which app are you working on?');

                    inquirer
                        .prompt([
                            {
                                type: 'list',
                                name: 'key',
                                message: 'Select a key',
                                choices: choices
                            }
                        ])
                        .then(function (answers) {
                            self.key = answers.key;
                            cb(err);
                        });
                }
            }
        );
    };

    // gets a remote block and sets as self.blockRemote
    self.blockGet = function (cb) {
        cli.debug('block');

        // look for the key in options
        // then remote block, then local block
        var givenBlock = options.block
            || self.blockRemote.id
            || self.blockLocal._id;

        var createcb = function () {
            blockCreate(self.key, function (err2, data) {
                self.blockRemote = data;
                cb(err2);
            });
        };

        api.request(
            'get',
            ['api', 'v1', 'blocks', 'key', self.key.id, 'block'],
            {},
            function (err, result) {
                if (err) {
                    cb(err);
                } else {
                    // if we force upsert, forget prompts
                    if (options.insert) {
                        createcb();
                    } else if (givenBlock) {
                        // if block is supplied through cli
                        var paramBlock = false;

                        result.payload.forEach(function (value) {
                            if (givenBlock === value.id) {
                                paramBlock = value;
                            }
                        });

                        if (!paramBlock) {
                            cb('Invalid block ID');
                        } else {
                            self.blockRemote = paramBlock;
                            cb(null);
                        }
                    } else {
                        // choose block with gui
                        var choices = [];
                        choices.push(new inquirer.Separator('--- Admin'));

                        choices.push({
                            name: 'Create a New Block',
                            value: false
                        });

                        if (result.payload.length) {
                            choices.push(new inquirer.Separator('--- Blocks'));

                            result.payload.forEach(function (value) {
                                choices.push({
                                    name: value.name,
                                    value: value
                                });
                            });
                        }

                        cli.ok('Which block are you working on?');

                        inquirer
                            .prompt([
                                {
                                    type: 'list',
                                    name: 'block',
                                    message: 'Select a block',
                                    choices: choices
                                }
                            ])
                            .then(function (answers) {
                                if (!answers.block) {
                                    createcb();
                                } else {
                                    self.blockRemote = answers.block;
                                    cb(null);
                                }
                            });
                    }
                }
            }
        );
    };

    // writes block to the local file
    self.blockWrite = function (cb) {
        cli.debug('blockWrite');

        // if for some reason blockLocal has key_id, remove it
        if (self.blockLocal.key_id) {
            delete self.blockLocal.key_id;
        }

        self.blockLocal._key_id = self.key.id;
        self.blockLocal._id = self.blockRemote.id;
        self.blockLocal.name = self.blockRemote.name;
        self.blockLocal.description = self.blockRemote.description;

        cli.info('Writing block.json to ' + blockFile);
        fs.outputJson(blockFile, self.blockLocal, { spaces: 4 }, cb);
    };

    // pushes self.blockLocal to endpoint
    self.blockPush = function (cb) {
        cli.debug('blockPush');

        self.blockLocal.block_id = self.blockLocal._id;
        self.blockLocal.id = self.blockLocal._id;

        api.request(
            'put',
            [
                'api',
                'v1',
                'blocks',
                'key',
                self.blockRemote.key_id,
                'block',
                self.blockRemote.id
            ],
            {
                body: self.blockLocal
            },
            function (err) {
                cb(err ? err.message : null);
            }
        );
    };

    // starts block on pubnub server
    self.blockStart = function (cb, doSubscribe) {
        cli.debug('blockStart');

        cli.ok('Sending Start Command');

        function errorCB(error) {
            console.log('ERROR cb', error);

            // Handle error here
            cb(JSON.stringify(error));
        }

        api.request(
            'post',
            [
                'api',
                'v1',
                'blocks',
                'key',
                self.blockLocal._key_id,
                'block',
                self.blockLocal._id,
                'start'
            ],
            {},
            function (error) {
                // show a loading spinner
                cli.spinner('Starting Block...');

                if (error) {
                    errorCB(error);
                    return;
                }

                if (doSubscribe) {
                    // after it starts
                    // we need to subscribe to the channel to see output
                    var pubnub = PUBNUB.init({
                        subscribe_key: self.key.subscribe_key,
                        publish_key: self.key.publish_key,
                        origin: self.env.origin,
                        secret_key: self.key.secret_key
                    });

                    // the channel is crazy
                    var chan = 'blocks-state-'
                        + self.key.properties.realtime_analytics_channel
                        + '.'
                        + self.blockLocal._id;

                    var cbCalled = false;

                    cli.info('Subscribing to blocks status channel...');

                    // subscribe to status channel
                    pubnub.subscribe({
                        channel: chan,
                        message: function (m) {
                            if (m.state === 'running') {
                                if (!cbCalled) {
                                    cli.spinner('Starting Block... OK', true);
                                    cli.ok('Block State: ' + m.state);

                                    cbCalled = true;
                                    cb();
                                }
                            }
                        },
                        error: errorCB
                    });
                } else {
                    cli.spinner('Starting Block... OK', true);

                    cb();
                }
            }
        );
    };

    // issue block stop request on server
    self.blockStop = function (cb) {
        cli.debug('blockStop');

        api.request(
            'post',
            [
                'api',
                'v1',
                'blocks',
                'key',
                self.blockLocal._key_id,
                'block',
                self.blockLocal._id,
                'stop'
            ],
            {},
            function (err) {
                cb(err);
            }
        );
    };

    // restart effectively is a stop and a start
    self.blockRestart = function (cb) {
        cli.debug('blockRestart');

        self.blockStop(function () {
            self.blockStart(cb);
        });
    };

    // get event handler from server and set as self.eventHandler
    self.eventHandlerGet = function (cb) {
        cli.debug('eventHandler');

        // if event is supplied through cli
        if (options.eventHandler) {
            var paramEventHandler = false;

            self.blockRemote.event_handlers.forEach(function (value) {
                if (options.eventHandler === value.id) {
                    paramEventHandler = value;
                }
            });

            if (!paramEventHandler) {
                cb('Invalid event handler ID');
            } else {
                self.eventHandler = paramEventHandler;
                cb(null);
            }
        } else {
            var choices = [];

            self.blockRemote.event_handlers.forEach(function (value) {
                choices.push({
                    name: value.name,
                    value: value
                });
            });

            if (choices.length === 1) {
                self.eventHandler = choices[0].value;
                cb(null);
            } else {
                cli.ok('Which event handler?');

                inquirer
                    .prompt([
                        {
                            type: 'list',
                            name: 'eventHandler',
                            message: 'Select an event handler',
                            choices: choices
                        }
                    ])
                    .then(function (answers) {
                        self.eventHandler = answers.eventHandler;
                        cb(null);
                    });
            }
        }
    };

    // write the event handler to a js file within a directory
    self.eventHandlerWrite = function (cb) {
        cli.debug('eventHandlerWrite');

        self.blockLocal.event_handlers = self.blockLocal.event_handlers || [];

        // for each server event handler
        async.eachSeries(
            self.blockRemote.event_handlers,
            function (eh, holla) {
                cli.info('Working on ' + eh.name);

                eh.file = eh.event + '/' + slug(eh.name) + '.js';
                var fullPath = workingDir + options.file + eh.file;

                // try to find event handler with same id
                var noIds = []; // count the number of eh with no id

                self.blockLocal.event_handlers.forEach(function (value) {
                    // if ids match
                    // overwrite local with what we have on server
                    if (eh.id === value._id) {
                        value = mergeEventHandler(value, eh);
                    }

                    // find event handlers on server that do not exist locally
                    if (!value._id) {
                        noIds.push(value);
                    }
                });

                // writes an event handler to disk
                var appendEH = function () {
                    cli.info('Writing event handler to ' + fullPath);
                    fs.outputFile(fullPath, eh.code, function () {
                        cli.debug('writing eventHandler');
                        self.blockLocal.event_handlers.push(mergeEventHandler({}, eh));
                        holla();
                    });
                };

                // if all the existing eh in the file have ids
                if (!noIds.length) {
                    // write the file and push
                    appendEH();
                } else {
                    cli.error(
                        'There is a remote event handler'
                        + 'that does not have a local link.'
                    );
                    cli.error(
                        'Does this (server) event handler'
                        + 'match a (local) event handler?'
                    );

                    cli.info('Event Handler Name: ' + eh.name);
                    cli.info('Event Handler Description: ' + eh.description);

                    var choices = [];

                    choices.push(new inquirer.Separator('--- Select'));

                    var i = 0;
                    self.blockLocal.event_handlers.forEach(function (value) {
                        choices.push({
                            name: value.name,
                            value: {
                                index: i,
                                value: value
                            }
                        });
                        i++;
                    });

                    choices.push(new inquirer.Separator('--- Create'));

                    choices.push({
                        name: 'Create a new event handler',
                        value: false
                    });

                    cli.info('prompt');

                    inquirer
                        .prompt([
                            {
                                type: 'list',
                                name: 'eh',
                                message: 'Which event handler is this?',
                                choices: choices
                            }
                        ])
                        .then(function (answers) {
                            if (!answers.eh) {
                                appendEH();
                            } else {
                                mergeEventHandler(
                                    self.blockLocal.event_handlers[answers.eh.index],
                                    eh
                                );
                                holla(null);
                            }
                        });
                }
            },
            function () {
                cli.debug('Writing event handlers to block.json to '
                    + blockFile);
                fs.outputJson(blockFile, self.blockLocal, { spaces: 4 }, cb);
            }
        );
    };

    // write the event handler test stub to a js file within a directory
    self.eventHandlerWriteTest = function (cb) {
        cli.debug('eventHandlerWriteTest');

        self.blockLocal.event_handlers = self.blockLocal.event_handlers || [];

        // for each server event handler
        async.forEachOf(
            self.blockRemote.event_handlers,
            function (eh, index, callback) {
                cli.info('Working on unit test for ' + eh.name);

                eh.file = eh.event + '/test/' + slug(eh.name) + '.test.js';
                var fullPath = workingDir + options.file + eh.file;
                self.blockLocal.event_handlers[index].test = eh.file;

                function getFileContents(data) {
                    return new Promise((resolve, reject) => {
                        data = data.replace(
                            /__eventhandlerpath__/g,
                            `${eh.event}/${slug(eh.name)}.js`
                        );
                        resolve(data);
                    });
                }

                function writeToFile(contents) {
                    cli.info('Writing unit test to ' + fullPath);
                    fs.outputFile(fullPath, contents, function () {
                        callback();
                    });
                }

                if (!fs.existsSync(fullPath)) {
                    let stubCode = otherTestStub;

                    if (eh.event === 'js-on-rest') {
                        stubCode = onreqTestStub;
                    }

                    getFileContents(stubCode).then(writeToFile);
                }
            },
            function () {
                cli.debug('Writing event handlers to block.json to '
                    + blockFile);
                fs.outputJson(blockFile, self.blockLocal, { spaces: 4 }, cb);
            }
        );
    };

    self.unitTestEventHandler = function (cb) {
        async.mapSeries(
            self.blockLocal.event_handlers,
            function (eh, holla) {
                if (eh.test && fs.existsSync(eh.test)) {
                    const Mocha = require('mocha');
                    const mocha = new Mocha();
                    mocha.addFile(eh.test);
                    // Run the tests.
                    mocha.run(function (failures) {
                        if (typeof failures === 'number' && failures > 0) {
                            process.exit(failures);
                        } else {
                            holla();
                        }
                    });
                } else {
                    holla();
                }
            },
            function (err, results) {
                cb();
            }
        );
    };

    // ensures that all properties exist within block.json
    self.blockComplete = function (cb) {
        cli.debug('ensuring block in block.json is complete');

        updateBlock(self.blockLocal, false, function (data) {
            self.blockLocal = mergeBlock(self.blockLocal, data);

            cli.debug('Writing block.json to ' + blockFile);
            fs.outputJson(blockFile, self.blockLocal, { spaces: 4 }, cb);
        });
    };

    // ensures that all needed properties exist within eventHandler
    self.eventHandlerComplete = function (cb) {
        cli.debug('ensuring event handler in block.json is complete');

        async.mapSeries(
            self.blockLocal.event_handlers,
            function (eh, holla) {
                updateEventHandler(eh, false, function (data) {
                    holla(null, mergeEventHandler(eh, data));
                });
            },
            function (err, results) {
                self.blockLocal.event_handlers = results;

                cli.debug('Writing block.json in' + blockFile);
                fs.outputJson(blockFile, self.blockLocal, { spaces: 4 }, cb);
            }
        );
    };

    // uploads the event handler to the server
    self.eventHandlerPush = function (cb) {
        cli.debug('eventHandlerPush');

        var update = function (data, done) {
            var id = data._id;

            data.id = id;
            data.key_id = self.blockRemote.key_id;

            if (id) {
                data.block_id = self.blockRemote.id;
                data.type = 'js';

                // if id exists, update (put)
                api.request(
                    'put',
                    [
                        'api',
                        'v1',
                        'blocks',
                        'key',
                        self.blockRemote.key_id,
                        'event_handler',
                        id
                    ],
                    {
                        body: data
                    },
                    done
                );
            } else {
                api.request(
                    'post',
                    [
                        'api',
                        'v1',
                        'blocks',
                        'key',
                        self.blockRemote.key_id,
                        'event_handler'
                    ],
                    {
                        body: data
                    },
                    done
                );
            }
        };

        // update all event handlers supplies in block.json
        async.each(
            self.blockLocal.event_handlers,
            function (eh, holla) {
                if (eh.file) {
                    var fullPath = workingDir + options.file + eh.file;
                    var testJson = workingDir + options.file + 'test.json';

                    cli.info('Uploading event handler from ' + fullPath);
                    fs.readFile(fullPath, 'utf8', function (err, data) {
                        if (err) {
                            holla(err.message);
                        } else {
                            // internal use only
                            // see if there's a test.json in directory
                            if (fs.existsSync(testJson)) {
                                // replace placeholder vars with those
                                // in test.json if so
                                var testVars = JSON.parse(fs.readFileSync(testJson, 'utf8'));

                                // do the actual replacing
                                Object.keys(testVars).forEach(function (key) {
                                    data = data.replace(key, testVars[key]);
                                });
                            }

                            eh.code = data;

                            update(eh, holla);
                        }
                    });
                } else {
                    update(eh, holla);
                }
            },
            cb
        );
    };

    self.eventHandlerLog = function (cb) {
        cli.debug('eventHandler Log');
        cli.ok('Working on Event Handler ' + self.eventHandler.name);

        // after it starts
        // we need to subscribe to the channel to see output
        var pubnub = PUBNUB.init({
            subscribe_key: self.key.subscribe_key,
            publish_key: self.key.publish_key,
            origin: self.env.origin,
            secret_key: self.key.secret_key
        });

        // the channel is crazy
        var chan = self.eventHandler.output;

        // show a loading spinner
        cli.spinner('Logging Output...');

        // subscribe to status channel
        pubnub.subscribe({
            channel: chan,
            message: function (m) {
                console.log(m);
            },
            error: function (error) {
                // Handle error here
                cb(JSON.stringify(error));
            }
        });
    };

    self.watchDir = function (cb) {
        var startStop = function () {
            self.blockStop(function () {
                self.blockStart(function () {}, true);
            });
        };

        startStop();

        var dStartStop = debounce(startStop, 5000, true);

        watch(workingDir, { recursive: true }, function (evt, name) {
            dStartStop();
        });
    };

    // this is an array of routes
    // each route matches a possible command supplies through the cli
    // ```functions``` is an array of methods that are executed in order
    // ```success``` is the message displayed
    // when all methods have been executed

    var routes = {
        login: {
            functions: ['sessionFileGet', 'sessionGet'],
            success: 'Logged In!'
        },
        logout: {
            functions: ['sessionFileGet', 'sessionDelete'],
            success: 'Logged Out'
        },
        init: {
            functions: [
                'sessionFileGet',
                'sessionGet',
                'blockFileCreate',
                'blockRead',
                'accountGet',
                'keyGet',
                'blockGet',
                'blockWrite',
                'eventHandlerWrite',
                'eventHandlerWriteTest'
            ],
            success: 'New block.json written to disk.'
        },
        push: {
            functions: [
                'sessionFileGet',
                'sessionGet',
                'blockRead',
                'accountGet',
                'keyGet',
                'blockGet',
                'blockComplete',
                'eventHandlerComplete',
                'unitTestEventHandler',
                'eventHandlerPush',
                'blockPush'
            ],
            success: 'Block pushed'
        },
        pull: {
            functions: [
                'sessionFileGet',
                'sessionGet',
                'requireInit',
                'blockRead',
                'accountGet',
                'keyGet',
                'blockGet',
                'blockWrite',
                'eventHandlerWrite',
                'eventHandlerWriteTest'
            ],
            success: 'Local block.json updated with remote data.'
        },
        restart: {
            functions: [
                'sessionFileGet',
                'sessionGet',
                'blockRead',
                'blockRestart'
            ],
            success: 'Block restarted'
        },
        start: {
            functions: [
                'sessionFileGet',
                'sessionGet',
                'blockRead',
                'accountGet',
                'keyGet',
                'blockStart'
            ],
            success: 'Block started'
        },
        stop: {
            functions: [
                'sessionFileGet',
                'sessionGet',
                'blockRead',
                'blockStop'
            ],
            success: 'Block stopped'
        },
        watch: {
            functions: [
                'sessionFileGet',
                'sessionGet',
                'blockRead',
                'accountGet',
                'keyGet',
                'blockGet',
                'blockComplete',
                'eventHandlerComplete',
                'watchDir'
            ],
            success: 'Whoop'
        },
        log: {
            functions: [
                'sessionFileGet',
                'sessionGet',
                'blockRead',
                'accountGet',
                'keyGet',
                'blockGet',
                'eventHandlerGet',
                'eventHandlerLog'
            ],
            success: 'Block Logging'
        },
        test: {
            functions: [
                'sessionFileGet',
                'sessionGet',
                'blockRead',
                'accountGet',
                'keyGet',
                'blockGet',
                'blockComplete',
                'eventHandlerComplete',
                'unitTestEventHandler'
            ],
            success: 'Tests Pass!'
        }
    };

    // this is the magic function that creates a function queue
    // using the supplied CLI command
    routes[cli.command].functions.forEach(function (value) {
        tasks.push(self[value]);
    });

    // async series is used to execute the commands in series
    // if one function fails, the process immediately returns
    // and displays an error
    async.series(tasks, function (err) {
        if (err) {
            // display our error if one is thrown
            if (err.code) {
                cli.error(
                    err.code
                    + ' - '
                    + (err.error || 'There was a problem with that request')
                );
            } else {
                cli.error(err);
            }
        } else {
            // otherwise, display the given success message
            cli.ok('---------------------------------------');
            if (routes[cli.command].success) {
                cli.ok(routes[cli.command].success);
            }
            cli.ok('Deluxe!');
            cli.ok('---------------------------------------');

            // display the 'use this command next time' message
            explain();
        }
    });

    return self;
});
