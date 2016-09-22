var os = require('os'); // os level functions

var inquirer = require('inquirer'); // interactive mode selection
var cli = require('cli').enable('status'); // Enable cli.ok, cli.error, etc
var async = require('async'); // async control flow
var fs = require('fs-extra'); // json support for fs
var PUBNUB = require('pubnub'); // obviously
var slug = require('slug'); // strips characters for friendly file names
var shelljs = require('shelljs'); // ability to run shell commands

var envs = require('./../envs'); // location of block environment configs
var networking = require('./networking');

// cli arguments and commands
cli.parse({
  block: ['b', 'Block ID', 'int'],
  key: ['k', 'Subscribe Key ID', 'int'],
  file: ['f', 'A block file', 'path'],
  env: ['e', 'An environment [bronze, silver, gold, prod]', 'string'],
  email: ['m', 'Email', 'string'],
  insert: ['n', 'Insert Mode. Create new blocks and skip prompts.', true, false],
  password: ['p', 'Password', 'string']
}, ['login', 'logout', 'start', 'stop', 'init', 'push', 'pull']);

// sets all file operations relative to the current directory
var workingDir = String(shelljs.pwd() + '/');

// cli function to parse arguments and options
cli.main(function (args, options) {
  options.file = options.file || '/';

  // an array of functions to run through in series
  // search for the string 'routes' in your IDE for more info
  var tasks = [];

  // default file location is pwd
  var blockFile = workingDir + options.file + 'block.json';

  // token and user info stored in home directory as this file
  var sessionFile = os.homedir() + '/.pubnub-cli';

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
  self.eventHandler = false; // the selected event handler object

  self.blockFileRequired = false;

  // specify the required environment
  options.env = options.env || 'prod';

  self.env = envs[options.env]; // map the env string to an object

  // pubnub-api is a custom api client for portal related operations
  var api = networking({
    debug: true,
    endpoint: self.env.host
  });

  if (!self.env) {
    cli.fatal('Invalid environment');
  } else {
    cli.ok('Working with ' + options.env + ' environment at ' + self.env.host);
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
        choices: ['js-after-publish', 'js-before-publish',
          'js-after-presence'
        ]
      },
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
        var eventHandlerName = eventHandler.name || eventHandler.event || 'Unknown';
        cli.error('Event handler ' + eventHandlerName + ' is missing some information.');
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

      api.createBlock({ keyId: key.id, blockPayload: block }, function (err, data) {
        cli.ok('Block Created');
        cb(err ? err.message : null, data.payload);
      });
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

    if (Object.keys(opts).length) {
      var hint = 'pubnub-cli ' + cli.command;

      Object.keys(opts).forEach(function (key) {
        hint = hint + ' -' + key + ' ' + opts[key];
      });

      cli.ok('Use this handy command next time:');
      cli.ok(hint);
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
          fs.outputJson(sessionFile, body.result, { spaces: 4 }, function (err2) {
            self.session = body.result;
            cb(err2);
          });
        }
      });
    };

    if (!self.session) {
      if (cli.command !== 'login') {
        cli.error('No session found, please log in.');
      }

      if (options.email || options.password) {
        if (options.email && options.password) {
          login({
            email: options.email,
            password: options.password
          }, cb);
        } else {
          cli.error('You must supply both email' +
            ' and password to login.');
        }
      } else {
        // no file found, prompt for user and pass
        inquirer.prompt([userQuestions.email, userQuestions.password]).then(function (answers) {
          login(answers, cb);
        });
      }
    } else {
      // we have the session file
      if (self.session.expires > (new Date().getTime() / 1000)) {
        cli.ok('Working as ' + self.session.user.email);

        // token is not expired, tell api to restore
        restore(self.session, cb);
      } else {
        // token expired, need to login again
        cli.error('Session has expired, please login.');

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
          cli.info('No block.json found.' +
            ' Please run pubnub-cli init.');
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
        fs.outputJson(blockFile, {}, {
          spaces: 4
        }, cb);
      }
    });
  };

  // sets self.key
  self.keyGet = function (cb) {
    cli.debug('keyGet');

    // looks first in options, then in remote block, then local block
    var givenKey = options.key || self.blockRemote.key_id || self.blockLocal._key_id;

    api.getApps({ ownerId: self.session.user.id }, function (err, data) {
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
          choices.push(new inquirer.Separator('---' + value.name));

          // loop through keys in app
          value.keys.forEach(function (value2) {
            choices.push({
              name: value2.properties.name || value2.subscribe_key,
              value: value2
            });
          });
        });

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

  // gets a remote block and sets as self.blockRemote
  self.blockGet = function (cb) {
    cli.debug('block');

    // look for the key in options
    // then remote block, then local block
    var givenBlock = options.block || self.blockRemote.id || self.blockLocal._id;

    var createcb = function () {
      blockCreate(self.key, function (err2, data) {
        self.blockRemote = data;
        cb(err2);
      });
    };

    api.getBlocks({ keyId: self.key.id }, function (err, result) {
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

          inquirer.prompt([{
            type: 'list',
            name: 'block',
            message: 'Select a block',
            choices: choices
          }]).then(function (answers) {
            if (!answers.block) {
              createcb();
            } else {
              self.blockRemote = answers.block;
              cb(null);
            }
          });
        }
      }
    });
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

    var blockPushArgs = {
      keyId: self.blockRemote.key_id,
      blockId: self.blockRemote.id,
      blockPayload: self.blockLocal
    };

    api.updateBlock(blockPushArgs, function (err) {
      cb(err ? err.message : null);
    });
  };

  // starts block on pubnub server
  self.blockStart = function (cb) {
    cli.debug('blockStart');

    api.startBlock({ keyId: self.blockLocal._key_id, blockId: self.blockLocal._id }, function () {
      cli.ok('Sending Start Command');

      // after it starts
      // we need to subscribe to the channel to see output
      var pubnub = PUBNUB.init({
        subscribe_key: self.key.subscribe_key,
        publish_key: self.key.publish_key,
        origin: self.env.origin
      });

      // the channel is crazy
      var chan = 'blocks-state-' +
        self.key.properties.realtime_analytics_channel +
        '.' + self.blockLocal._id;

      cli.info('Subscribing to blocks status channel...');

      // show a loading spinner
      cli.spinner('Starting Block...');

      // subscribe to status channel
      pubnub.subscribe({
        channel: chan,
        message: function (m) {
          if (m.state === 'running') {
            cli.spinner('Starting Block... OK', true);
            cli.ok('Block State: ' + m.state);
            cb();
          } else if (m.state === 'stopped') {
            cli.ok('Block State: ' + m.state);
            cb();
          } else {
            if (m.state !== 'pending') {
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

  // issue block stop request on server
  self.blockStop = function (cb) {
    cli.debug('blockStop');

    api.stopBlock({ keyId: self.blockLocal._key_id, blockId: self.blockLocal._id }, function (err) {
      cb(err);
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
        choices.push({ name: value.name, value: value });
      });

      cli.ok('Which event handler?');

      inquirer.prompt([{
        type: 'list',
        name: 'eventHandler',
        message: 'Select an event handler',
        choices: choices
      }]).then(function (answers) {
        self.eventHandler = answers.eventHandler;
        cb(null);
      });
    }
  };

  // write the event handler to a js file within a directory
  self.eventHandlerWrite = function (cb) {
    cli.debug('eventHandlerWrite');

    self.blockLocal.event_handlers = self.blockLocal.event_handlers || [];

    // for each server event handler
    async.eachSeries(self.blockRemote.event_handlers, function (eh, holla) {
      cli.info('Working on ' + eh.name);

      eh.file = eh.event + '/' + slug(eh.name) + '.js';
      var fullPath = workingDir + options.file + eh.file;

      // try to find event handler with same id
      var noIds = []; // count the number of eh with no id

      var found = false;

      self.blockLocal.event_handlers.forEach(function (value) {
        // if ids match
        // overwrite local with what we have on server
        if (eh.id === value._id) {
          found = true;
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

      // if server event handler exists and no match found
      if (!found) {
        // if all the existing eh in the file have ids
        if (!noIds.length) {
          // write the file and push
          appendEH();
        } else {
          cli.error('There is a remote event handler that does not have a local link.');
          cli.error('Does this (server) event handler match a (local) event handler?');

          cli.info('Event Handler Name: ' + eh.name);
          cli.info('Event Handler Description: ' + eh.description);

          var choices = [];

          choices.push(new inquirer.Separator('--- Select'));

          var i = 0;
          self.blockLocal.event_handlers.forEach(function (value) {
            choices.push({ name: value.name, value: { index: i, value: value } });
            i += 1;
          });

          choices.push(new inquirer.Separator('--- Create'));

          choices.push({ name: 'Create a new event handler', value: false });

          cli.info('prompt');

          inquirer.prompt([{
            type: 'list',
            name: 'eh',
            message: 'Which event handler is this?',
            choices: choices
          }]).then(function (answers) {
            if (!answers.eh) {
              appendEH();
            } else {
              mergeEventHandler(
                self.blockLocal.event_handlers[
                  answers.eh.index], eh);
              holla(null);
            }
          });
        }
      }
    },
      function () {
        cli.debug('Writing event handlers to block.json to ' + blockFile);
        fs.outputJson(blockFile, self.blockLocal, { spaces: 4 }, cb);
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

    async.mapSeries(self.blockLocal.event_handlers, function (eh, holla) {
      updateEventHandler(eh, false, function (data) {
        holla(null, mergeEventHandler(eh, data));
      });
    }, function (err, results) {
      self.blockLocal.event_handlers = results;

      cli.debug('Writing block.json in' + blockFile);
      fs.outputJson(blockFile, self.blockLocal, { spaces: 4 }, cb);
    });
  };

  // uploads the event handler to the server
  self.eventHandlerPush = function (cb) {
    cli.debug('eventHandlerPush');

    var update = function (data, done) {
      var id = data._id;

      // these properties don't exist on server, so don't send them
      delete data._id;
      if (data.file) {
        delete data.file;
      }

      if (id) {
        // if id exists, update (put)
        api.updateBlock({ keyId: self.blockRemote.key_id, eventHandlerId: id, eventHandlerPayload: data }, done);
      } else {
        // of id does not exist (update)
        data.block_id = self.blockRemote.id;
        data.key_id = self.blockRemote.key_id;
        data.type = 'js';

        api.createBlock({ keyId: self.blockRemote.key_id, eventHandlerPayload: data }, done);
      }
    };

    // update all event handlers supplies in block.json
    async.each(self.blockLocal.event_handlers, function (eh, holla) {
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
    }, cb);
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
      functions: ['sessionFileGet', 'sessionGet',
        'blockFileCreate', 'blockRead', 'keyGet', 'blockGet',
        'blockWrite', 'eventHandlerWrite'
      ],
      success: 'New block.json written to disk.'
    },
    push: {
      functions: ['sessionFileGet', 'sessionGet', 'blockRead',
        'keyGet', 'blockGet', 'blockComplete',
        'eventHandlerComplete', 'eventHandlerPush',
        'blockPush'
      ],
      success: 'Block pushed'
    },
    pull: {
      functions: ['sessionFileGet', 'sessionGet', 'requireInit',
        'blockRead', 'keyGet', 'blockGet', 'blockWrite',
        'eventHandlerWrite'
      ],
      success: 'Local block.json updated with remote data.'
    },
    start: {
      functions: ['sessionFileGet', 'sessionGet', 'blockRead',
        'keyGet', 'blockStart'
      ],
      success: 'Block started'
    },
    stop: {
      functions: ['sessionFileGet', 'sessionGet', 'blockRead',
        'blockStop'
      ],
      success: 'Block stopped'
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
        cli.error(err.code + ' - ' + (err.error || 'There was a problem with that request'));
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

      // forceful exit
      process.exit(0);
    }
  });

  return self;
});
