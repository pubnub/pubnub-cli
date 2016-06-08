var inquirer = require('inquirer');
var cli = require('cli').enable('status'); //Enable 2 plugins
var os = require('os');
var async = require('async');
var fs = require('fs-extra');
var PUBNUB = require('pubnub');
var slug = require('slug');

require('shelljs/global');

var api = require('./lib/pubnub-api')({
    debug: false
});

cli.parse({

    block: ['b', 'Specify a Block ID', 'int'],
    key: ['k', 'Specify a Subscribe Key ID', 'int'],
    file: ['f', 'Specify a block file', 'path']

}, ['login', 'logout', 'start', 'stop', 'init', 'push', 'pull']);


var working_dir = String(pwd());

cli.main(function(args, options) {

    options.file = options.file || '/';

    var tasks = [];
    var block_file = working_dir + options.file + 'block.json';
    var session_file = os.homedir() + '/.pubnub-cli';
    var user_questions = {
        email: {
            name: 'email',
            message: 'PubNub Email:',
            type: 'input',
            validate: function (input) {
                
                if(input.indexOf('@') == -1) {
                    return 'Please enter a valid email address.'
                } else {
                    return true;
                }

            }
        },
        password: {
            name: 'password',
            message: 'PubNub Password:',
            type: 'password'
        }
    };

    var mergeEventHandler = function(input, data) {

        input._id = data.id || input._id;
        input.name = data.name || input.name;
        input.event = data.event || input.event;
        input.channels = data.channels || input.channels;
        input.file = data.file || input.file;
        input.output = data.output || input.output;

        return input;

    };

    var updateEventHandler = function(event_handler, revise, cb) {

        var o = {
            name: {
                name: 'name',
                message: 'Name:',
                type: 'input',
                default: event_handler.name
            },
            event: {
                name: 'event',
                message: 'Event:',
                type: 'list',
                default: event_handler.event,
                choices: ['js-after-publish', 'js-before-publish', 'js-after-presence']
            },
            channels: {
                name: 'channels',
                message: 'PubNub Channels:',
                type: 'input',
                default: event_handler.channels
            },
            output: {
                name: 'output',
                message: 'Output:',
                type: 'input',
                default: event_handler.output
            }
        };

        var qs = [];
        for(var prop in o) {
            if(revise || !event_handler.hasOwnProperty(prop)){
                qs.push(o[prop]);
            }
        }

        if(qs.length) {

            if(!revise) {
                cli.error('Event handler ' + (event_handler.name || event_handler.event || 'Unknown') + ' is missing some information.');
            }

            inquirer.prompt(qs).then(cb);            

        } else {
            cb(event_handler);
        }


    }

    var mergeBlock = function(input, data) {

        input._id = data.id || input._id;
        input._key_id = data.key_id || input._key_id;
        input.name = data.name || input.name;
        input.description = data.name || input.description;

        return input;

    };

    var updateBlock = function(block, revise, cb) {

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

        var qs = [];
        for(var prop in o) {
            if(revise || !block.hasOwnProperty(prop)){
                qs.push(o[prop]);
            }
        }

        if(qs.length) {

            if(!revise) {
                cli.error('Block.json is missing some information.');
            }

            inquirer.prompt(qs).then(cb);            

        } else {
            cb(block);
        }

    }

    var restore = function(session, cb) {
        api.session = session;
        cb(null, session);
    };

    var block_create = function(key, cb) {

        updateBlock(block_local, true, function(block) {

            block.key_id = key.id;
            block.subscribe_key = key.subscribe_key;
            block.publish_key = key.publish_key;

            api.request('post', ['api', 'v1', 'blocks', 'key', key.id, 'block'], {
                form: block
            }, function(err, data) {

                cli.ok('Block Created');
                cb(err ? err.message : null, data.payload);

            });

        });

    };

    var event_handler_create = function(block){

        updateEventHandler({}, true, function(eh){

            eh.block_id = block.id;
            eh.key_id = block.key_id;

            eh.type = 'js';
            eh.code = '// code goes here'; // this should be able to be supplied through -f

            api.request('post', ['api', 'v1', 'blocks', 'key', block.key_id, 'event_handler'], {
                form: eh
            }, function(err, data) {

                cli.ok('Event Handler Created');
                cb(err ? err.message : null);

            });

        });
        
            
    }

    var init = function() {

        var self = this;

        self.session = false;
        self.block_local = false;
        self.block = false;
        self.key = false;
        self.event_handler = false;

        var explain = function() {
            
            var opts = {};
            if(self.block) {
                opts['b'] = self.block.id;
            }
            if(self.key) {
                opts['k'] = self.key.id;
            }
            if(options.file && options.file !== '/') {
                opts['f'] = options.file;
            }

            if(Object.keys(opts).length) {

                var hint = 'node pubnub-cli ' + cli.command;
                for(var key in opts) {
                    hint = hint + ' -' + key + ' ' + opts[key];
                }

                cli.ok('Use this handy command next time:');
                cli.ok(hint);
                   
            }

        }

        self.session_file_get = function(cb) {
            
            cli.debug('session_file_get');

            // see if session file exists
            cli.info('Reading session from ' + session_file);
            fs.readJson(session_file, function(err, session) {

                if(err) {
                    cb(null);
                } else {
                    self.session = session;
                    cb(null);
                }

            });

        };

        self.session_delete = function(cb) {
            
            cli.debug('delete_settings');

            if(!self.session) {
                cli.error('You are not logged in.');
            } else {
                
                cli.info('Deleting session from ' + session_file);
                fs.unlink(session_file, function(err) {
                    if(err) {
                        cb(err);
                    } else {
                        cb();
                    }
                });

            }

        };

        self.session_get = function(cb) {

            cli.debug('get_user');

            var login = function(args, cb) {

                cli.spinner('Logging In...');
                
                api.init(args, function (err, body) {

                    cli.spinner('Logging In... Done!', true);

                    if(err) {
                        cb(err)
                    } else {

                        cli.info('Writing session to ' + session_file);
                        fs.outputJson(session_file, body.result, {spaces: 4}, function (err) {
                            self.session = body.result;
                            cb(err);
                        });

                    }

                });

            };

            if(!self.session) {

                if(cli.command != "login") {
                    cli.error('No session found, please log in.');   
                }
                
                // no file found, prompt for user and pass
                inquirer.prompt([user_questions.email, user_questions.password]).then(function (answers) {
                    login(answers, cb)
                });

            } else {

                // we have the file
                if( self.session.expires > (new Date().getTime() / 1000)) {

                    cli.ok('Working as ' + self.session.user.email);

                    // token is not expired, tell api to restore
                    restore(self.session, cb);

                } else {
                
                    // token expired, need to login again
                    cli.error('Session has expired, please login.');

                    // supply email, prompt password
                    inquirer.prompt([user_questions.password]).then(function (answers) {
                        answers.email = self.session.user.email;
                        login(answers, cb)
                    });

                }

            }

        };

        self.block_read = function(cb) {
            
            cli.debug('block_read');

            cli.info('Reading block.json from ' + block_file);
            fs.readJson(block_file, function(err, data){

                if(err) {
                    if(options.key && options.block) {
                        cb(null)
                    } else {
                        cb('No block.json found. Please run init or specify a file with -f.');   
                    }
                } else {

                    if(data.name) {
                        cli.ok('Working on block ' + data.name);
                    }

                    self.block_local = data;
                    cb();

                }
            });

        };

        self.block_file_create = function(cb) {
            
            cli.debug('block_file_create');

            cli.info('Checking for block.json in ' + block_file);
            fs.readJson(block_file, function(err, data) {
                
                if(data) {
                    cb('block.json already exists, refusing to overwrite.');
                } else {

                    cli.info('Writing block.json to ' + block_file);
                    fs.outputJson(block_file, {}, {spaces: 4}, cb);
                }

            });

        };

        self.key_get = function(cb) {

            cli.debug('key_get');

            var given_key = options.key || self.block_local._key_id;

            api.request('get', ['api', 'apps'], {
                qs: {
                    owner_id: self.session.user.id
                }
            }, function(err, data) {

                // if key is supplied through cli or file
                if(given_key) {

                    var param_key = false;
                    for(var i in data.result) {
                        for(var j in data.result[i].keys) {
                            if(given_key == data.result[i].keys[j].id) {
                                param_key = data.result[i].keys[j]
                            }
                        }
                    }

                    if(!param_key) {
                        cb('Invalid key ID');
                    } else {
                        self.key = param_key;
                        cb(err);
                    }
                       
                } else {

                    var choices = [];
                    for(var i in data.result) {

                        choices.push(new inquirer.Separator('---' + data.result[i].name));
                        for(var j in data.result[i].keys) {
                            choices.push({
                                name: data.result[i].keys[j].properties.name || data.result[i].keys[j].subscribe_key,
                                value: data.result[i].keys[j]
                            });
                        }

                    }

                    cli.ok('Which app are you working on?');

                    inquirer.prompt([{
                        type: 'list',
                        name: 'key',
                        message: 'Select a key',
                        choices: choices
                    }]).then(function (answers) {
                        self.key = answers.key;
                        cb(err);
                    });

                }

            });

        };

        self.block_get = function(cb) {
            
            cli.debug('block');
            
            var given_block = options.block || self.block_local._id;

            api.request('get', ['api', 'v1', 'blocks', 'key', self.key.id, 'block'], {}, function(err, result) {

                if(err) {
                    cb(err);
                } else {

                    if(given_block) {

                        // if block is supplied through cli
                        var param_block = false;
                        for(var i in result.payload) {
                            if(given_block == result.payload[i].id) {
                                param_block = result.payload[i];
                            }
                        }

                        if(!param_block) {
                            cb('Invalid block ID');
                        } else {
                            self.block = param_block;
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

                        if(result.payload.length) {

                            choices.push(new inquirer.Separator('--- Blocks'));

                            for(var i in result.payload) {

                                choices.push({
                                    name: result.payload[i].name,
                                    value: result.payload[i]
                                });

                            }
                               
                        }

                        cli.ok('Which block are you working on?');

                        inquirer.prompt([{
                            type: 'list',
                            name: 'block',
                            message: 'Select a block',
                            choices: choices
                        }]).then(function (answers) {

                            if(!answers.block) {

                                block_create(key, function(err, data){
                                    self.block = data;
                                    cb(err);
                                });

                            } else {
                                self.block = answers.block;
                                cb(null);
                            }

                        });
                           
                    }

                }

            });

        };

        self.block_write = function(cb) {

            cli.debug('block_write');

            self.block_local._key_id = self.key.id;
            self.block_local._id = self.block.id;
            self.block_local.name = self.block.name;
            self.block_local.description = self.block.description;

            cli.info('Writing block.json to ' + block_file);
            fs.outputJson(block_file, self.block_local, {spaces: 4}, cb);

        };

        self.block_push = function(cb) {

            cli.debug('block_push');

            api.request('put', ['api', 'v1', 'blocks', 'key', self.block_local._key_id, 'block', self.block_local._id], {
                form: self.block_local
            }, function(err, data) {

                cb(err ? err.message : null);

            });

        };

        self.block_start = function(cb) {
            
            cli.debug('block_start');

            api.request('post', ['api', 'v1', 'blocks', 'key', self.key.id, 'block', self.block_local._id, 'start'], {}, function(err, data) {

                cli.ok('Sending Start Command');

                var pubnub = PUBNUB.init({
                    subscribe_key: self.key.subscribe_key,
                    publish_key: self.key.publish_key,
                    origin: 'balancer1.gold.aws-pdx-3.ps.pn'
                });

                var chan = 'blocks-state-' + self.key.properties.realtime_analytics_channel + '.' + self.block_local._id;
                var pending = false;

                cli.info('Subscribing to blocks status channel...');

                cli.spinner('Starting Block...');

                pubnub.subscribe({
                    channel: chan,
                    message: function(m) {
                        if(m.state == "running") {
                            cli.spinner('Starting Block... OK', true);
                            cli.ok('Block State: ' + m.state);
                            cb();
                        } else if(m.state == "stopped") {
                            cli.ok('Block State: ' + m.state);
                            cb();
                        } else {
                            if(m.state !== "pending") {
                                cli.info('Block State: ' + m.state + '...');                            
                            }
                        }
                    },
                    error: function (error) {
                        // Handle error here
                        cb(JSON.stringify(error));
                    }
                });

            });

        };

        self.block_stop = function(cb) {

            cli.debug('block_stop');

            api.request('post', ['api', 'v1', 'blocks', 'key', self.key.id, 'block', self.block_local._id, 'stop'], {}, function(err, data) {
                
                cb(err);

            });

        };

        self.event_handler_get = function(cb) {

            cli.debug('event_handler'); 

            // if event is supplied through cli
            if(options.event_handler) {

                var param_ = false;
                for(var i in self.block.event_handlers) {
                    if(options.event_handler == self.block.event_handlers[i].id) {
                        param_event_handler = self.block.event_handlers[i];
                    }
                }

                if(!param_event_handler) {
                    cb('Invalid event handler ID');
                } else {
                    self.event_handler = param_event_handler;
                    cb(null);
                }

            } else {

                var choices = [];
                for(var i in self.block.event_handlers) {

                    choices.push({
                        name: self.block.event_handlers[i].name,
                        value: self.block.event_handlers[i]
                    });

                }

                cli.ok('Which event handler?');

                inquirer.prompt([{
                    type: 'list',
                    name: 'event_handler',
                    message: 'Select an event handler',
                    choices: choices
                }]).then(function (answers) {
                    self.event_handler = answers.event_handler;
                    cb(null);
                });

            }


        };

        self.event_handler_write = function(cb) {
            
            cli.debug('event_handler_write');

            self.block_local.event_handlers = self.block_local.event_handlers || [];

            async.each(self.block.event_handlers, function(eh, cb) {

                eh.file = eh.event + '/' + slug(eh.name) + '.js';
                full_path = working_dir + options.file + eh.file;

                cli.info('Writing event handler to ' + full_path);
                fs.outputFile(full_path, eh.code, function (err) {

                    cli.debug('writing event_handler');

                    var found = false;
                    
                    for(var j in self.block_local.event_handlers) {

                        if(eh.id == self.block_local.event_handlers[j]._id) {
                            var found = true;
                            self.block_local.event_handlers[j] = mergeEventHandler(self.block_local.event_handlers[j], eh);
                        }

                    }

                    if(!found) {
                        // also needs to create directory and add file
                        self.block_local.event_handlers.push(mergeEventHandler({}, eh));
                    }

                    cb();

                });

            }, function(err) {
                
                cli.debug('Writing event handlers to block.json in' + block_file);
                fs.outputJson(block_file, self.block_local, {spaces: 4}, cb);

            });

        };

        self.block_complete = function(cb) {

            cli.debug('ensuring block in block.json is complete');

            updateBlock(self.block_local, false, function(data) {

                self.block_local = mergeBlock(self.block_local, data);

                cli.debug('Writing block.json in' + block_file);
                fs.outputJson(block_file, self.block_local, {spaces: 4}, cb);

            });

        };

        self.event_handler_complete = function(cb) {
            
            cli.debug('ensuring event handler in block.json is complete');

            async.mapSeries(self.block_local.event_handlers, function(eh, holla) {

                updateEventHandler(eh, false, function(data) {
                    holla(null, mergeEventHandler(eh, data));
                });

            }, function(err, results){

                self.block_local.event_handlers = results;

                cli.debug('Writing block.json in' + block_file);
                fs.outputJson(block_file, self.block_local, {spaces: 4}, cb);

            });

        };

        self.event_handler_push = function(cb) {

            cli.debug('event_handler_push');

            var update = function(data, done) {

                var id = data._id;
                
                delete data._id;
                if(data.file) {
                    delete data.file;   
                }
                
                if(id) {

                    api.request('put', ['api', 'v1', 'blocks', 'key', self.block.key_id, 'event_handler', id], {
                        form: data
                    }, done);

                } else {

                    data.block_id = self.block.id;
                    data.key_id = self.block.key_id;
                    data.type = 'js';

                    api.request('post', ['api', 'v1', 'blocks', 'key', self.block.key_id, 'event_handler'], {
                        form: data
                    }, done);


                }
            
            };

            async.each(self.block_local.event_handlers, function(eh, holla) {

                if(eh.file) {

                    full_path = working_dir + options.file + eh.file;

                    cli.info('Uploading event handler from ' + full_path);
                    fs.readFile(full_path, 'utf8', function (err,data) {

                        if(err) {
                            return holla(err.message);
                        } else {
                            eh.code = data;
                            update(eh, holla);
                        }

                    });

                } else {
                    update(eh, holla);
                }

            }, cb);

        };

        var routes = {
            login: {
                functions: ['session_file_get', 'session_get'],
                success: 'Logged In!'
            },
            logout: {
                functions: ['session_file_get', 'session_delete'],
                success: 'Logged Out'
            },
            init: {
                functions: ['session_file_get', 'session_get', 'block_file_create', 'block_read', 'key_get', 'block_get', 'block_write', 'event_handler_write'],
                success: 'New block.json written to disk.'
            },
            push: {
                functions: ['session_file_get', 'session_get', 'block_read', 'key_get', 'block_get', 'block_complete', 'event_handler_complete', 'event_handler_push', 'block_push'],
                success: 'Block pushed'
            },
            pull: {
                functions: ['session_file_get', 'session_get', 'block_read', 'key_get', 'block_get', 'block_write', 'event_handler_write'],
                success: 'Local block.json updated with remote data.'
            }, 
            start: {
                functions: ['session_file_get', 'session_get', 'block_read', 'key_get', 'block_start'],
                success: 'Block started'
            },
            stop: {
                functions: ['session_file_get', 'session_get', 'block_read', 'key_get', 'block_stop'],
                success: 'Block stopped'
            }
        };


        for(var cmd in routes[cli.command].functions) {
            tasks.push(self[routes[cli.command].functions[cmd]]);
        }

        async.series(tasks, function(err, results) {

            if(err) {
                if(err.code) {
                    cli.error(err.code + ' - ' + (err.error || 'There was a problem with that request'));   
                } else {
                    cli.error(err);
                }
            } else {
                
                cli.ok('---------------------------------------');
                if(routes[cli.command].success) {
                    cli.ok(routes[cli.command].success);
                }
                cli.ok('Deluxe!');
                cli.ok('---------------------------------------');
                
                explain();

                process.exit(0);
            }
        });

        return self;

    };

    if(!cli.command) {
        return cli.error('Please supply a command. Try running pubnub-cli -h for more info');
    }  else {
        init();
    }

});