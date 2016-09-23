'use strict';

var os = require('os');

var inquirer = require('inquirer');
var cli = require('cli').enable('status');
var async = require('async');
var fs = require('fs-extra');
var PUBNUB = require('pubnub');
var slug = require('slug');
var shelljs = require('shelljs');

var envs = require('./../envs');
var packageInfo = require('./../package');
var Networking = require('./networking');

cli.enable('version');

cli.setApp('PubNub CLI', packageInfo.version);

cli.parse({
  block: ['b', 'Block ID', 'int'],
  key: ['k', 'Subscribe Key ID', 'int'],
  file: ['f', 'A block file', 'path'],
  env: ['e', 'An environment [bronze, silver, gold, prod]', 'string'],
  email: ['m', 'Email', 'string'],
  insert: ['n', 'Insert Mode. Create new blocks and skip prompts.', true, false],
  password: ['p', 'Password', 'string'],
  log_level: [false, 'set logging verbosity (info, debug)', 'string', 'info']
}, ['login', 'logout', 'start', 'stop', 'init', 'push', 'pull']);

var workingDir = String(shelljs.pwd() + '/');

cli.main(function (args, options) {
  options.file = options.file || '/';

  var tasks = [];

  var blockFile = workingDir + options.file + 'block.json';

  var sessionFile = os.homedir() + '/.pubnub-cli';

  if (options.insert) {
    cli.info('Warning! Insert option provided.');
    cli.info('Creating new blocks and skipping prompts.');
  }

  var userQuestions = {
    email: {
      name: 'email',
      message: 'PubNub Email:',
      type: 'input',
      validate: function validate(input) {
        var result = true;

        if (input.indexOf('@') === -1) {
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

  self.session = false;
  self.blockLocal = false;
  self.blockRemote = false;
  self.key = false;
  self.eventHandler = false;

  self.blockFileRequired = false;

  options.env = options.env || 'prod';

  self.env = envs[options.env];
  var api = new Networking({
    logLevel: options.log_level,
    endpoint: self.env.host
  });

  if (!self.env) {
    cli.fatal('Invalid environment');
  } else {
    cli.ok('Working with ' + options.env + ' environment at ' + self.env.host);
  }

  var mergeEventHandler = function mergeEventHandler(input, data) {
    cli.debug('Merging remote event handle with local event handler.');

    input._id = data.id || input._id;
    input.name = data.name || input.name;
    input.event = data.event || input.event;
    input.channels = data.channels || input.channels;
    input.file = input.file || data.file;
    input.output = data.output || input.output;

    return input;
  };

  var updateEventHandler = function updateEventHandler(eventHandler, revise, cb) {
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
        choices: ['js-after-publish', 'js-before-publish', 'js-after-presence']
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

    var qs = [];
    Object.keys(o).forEach(function (key) {
      if (revise || !eventHandler.hasOwnProperty(key)) {
        qs.push(o[key]);
      }
    });

    if (qs.length) {
      if (!revise) {
        var eventHandlerName = eventHandler.name || eventHandler.event || 'Unknown';
        cli.error('Event handler ' + eventHandlerName + ' is missing some information.');
      }

      inquirer.prompt(qs).then(cb);
    } else {
      cb(eventHandler);
    }
  };

  var mergeBlock = function mergeBlock(input, data) {
    cli.debug('Merging remote block with local block.');

    input._id = data.id || input._id;
    input._key_id = data.key_id || input._key_id;
    input.name = data.name || input.name;
    input.description = data.description || input.description;

    return input;
  };

  var updateBlock = function updateBlock(block, revise, cb) {
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
    Object.keys(o).forEach(function (key) {
      if (revise || !block.hasOwnProperty(key)) {
        qs.push(o[key]);
      }
    });

    if (qs.length) {
      if (!revise) {
        cli.error('Block.json is missing some information.');
      }

      inquirer.prompt(qs).then(cb);
    } else {
      cb(block);
    }
  };

  var restore = function restore(session, cb) {
    api.session = session;
    cb(null, session);
  };

  var blockCreate = function blockCreate(key, cb) {
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

  var explain = function explain() {
    var opts = {};

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
      (function () {
        var hint = 'pubnub-cli ' + cli.command;

        Object.keys(opts).forEach(function (key) {
          hint = hint + ' -' + key + ' ' + opts[key];
        });

        cli.ok('Use this handy command next time:');
        cli.ok(hint);
      })();
    }
  };

  self.sessionFileGet = function (cb) {
    cli.debug('sessionFileGet');

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

  self.sessionGet = function (cb) {
    cli.debug('get_user');

    var login = function login(args2) {
      cli.spinner('Logging In...');

      api.createLoginToken(args2, function (err, data) {
        if (err) return cli.error(err);

        cli.info('Writing session to ' + sessionFile);

        fs.outputJson(sessionFile, data.result, { spaces: 4 }, function (err2) {
          self.session = data.result;
          api.updateSessionToken(data.result.token);
          cb(err2);
        });
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
          cli.error('You must supply both email' + ' and password to login.');
        }
      } else {
        inquirer.prompt([userQuestions.email, userQuestions.password]).then(function (answers) {
          login(answers, cb);
        });
      }
    } else {
      if (self.session.expires > new Date().getTime() / 1000) {
        cli.ok('Working as ' + self.session.user.email);

        restore(self.session, cb);
      } else {
        cli.error('Session has expired, please login.');

        inquirer.prompt([userQuestions.password]).then(function (answers) {
          answers.email = self.session.user.email;
          login(answers, cb);
        });
      }
    }
  };

  self.requireInit = function (cb) {
    self.blockFileRequired = true;
    cb();
  };

  self.blockRead = function (cb) {
    cli.debug('blockRead');

    cli.info('Reading block.json from ' + blockFile);
    fs.readJson(blockFile, function (err, data) {
      if (err) {
        if (self.blockFileRequired) {
          cli.info('No block.json found.' + ' Please run pubnub-cli init.');
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

  self.keyGet = function (cb) {
    cli.debug('keyGet');

    var givenKey = options.key || self.blockRemote.key_id || self.blockLocal._key_id;

    api.getApps({ ownerId: self.session.user.id }, function (err, data) {
      if (givenKey) {
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
        (function () {
          var choices = [];

          data.result.forEach(function (value) {
            choices.push(new inquirer.Separator('---' + value.name));

            value.keys.forEach(function (value2) {
              choices.push({
                name: value2.properties.name || value2.subscribe_key,
                value: value2
              });
            });
          });

          cli.ok('Which app are you working on?');

          inquirer.prompt([{ type: 'list', name: 'key', message: 'Select a key', choices: choices }]).then(function (answers) {
            self.key = answers.key;
            cb(err);
          });
        })();
      }
    });
  };

  self.blockGet = function (cb) {
    cli.debug('block');

    var givenBlock = options.block || self.blockRemote.id || self.blockLocal._id;

    var createcb = function createcb() {
      blockCreate(self.key, function (err2, data) {
        self.blockRemote = data;
        cb(err2);
      });
    };

    api.getBlocks({ keyId: self.key.id }, function (err, result) {
      if (err) {
        cb(err);
      } else {
        if (options.insert) {
          createcb();
        } else if (givenBlock) {
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
          (function () {
            var choices = [];
            choices.push(new inquirer.Separator('--- Admin'));

            choices.push({
              name: 'Create a New Block',
              value: false
            });

            if (result.payload.length) {
              choices.push(new inquirer.Separator('--- Blocks'));

              result.payload.forEach(function (value) {
                choices.push({ name: value.name, value: value });
              });
            }

            cli.ok('Which block are you working on?');

            inquirer.prompt([{ type: 'list', name: 'block', message: 'Select a block', choices: choices }]).then(function (answers) {
              if (!answers.block) {
                createcb();
              } else {
                self.blockRemote = answers.block;
                cb(null);
              }
            });
          })();
        }
      }
    });
  };

  self.blockWrite = function (cb) {
    cli.debug('blockWrite');

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

  self.blockStart = function (cb) {
    cli.debug('blockStart');

    api.startBlock({ keyId: self.blockLocal._key_id, blockId: self.blockLocal._id }, function () {
      cli.ok('Sending Start Command');

      var pubnub = PUBNUB.init({
        subscribe_key: self.key.subscribe_key,
        publish_key: self.key.publish_key,
        origin: self.env.origin
      });

      var chan = 'blocks-state-' + self.key.properties.realtime_analytics_channel + '.' + self.blockLocal._id;

      cli.info('Subscribing to blocks status channel...');

      cli.spinner('Starting Block...');

      pubnub.subscribe({
        channel: chan,
        message: function message(m) {
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
        error: function error(_error) {
          cb(JSON.stringify(_error));
        }
      });
    });
  };

  self.blockStop = function (cb) {
    cli.debug('blockStop');

    api.stopBlock({ keyId: self.blockLocal._key_id, blockId: self.blockLocal._id }, function (err) {
      cb(err);
    });
  };

  self.eventHandlerGet = function (cb) {
    cli.debug('eventHandler');

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
      (function () {
        var choices = [];

        self.blockRemote.event_handlers.forEach(function (value) {
          choices.push({ name: value.name, value: value });
        });

        cli.ok('Which event handler?');

        var message = 'Select an event handler';
        inquirer.prompt([{ type: 'list', name: 'eventHandler', message: message, choices: choices }]).then(function (answers) {
          self.eventHandler = answers.eventHandler;
          cb(null);
        });
      })();
    }
  };

  self.eventHandlerWrite = function (cb) {
    cli.debug('eventHandlerWrite');

    self.blockLocal.event_handlers = self.blockLocal.event_handlers || [];

    async.eachSeries(self.blockRemote.event_handlers, function (eh, holla) {
      cli.info('Working on ' + eh.name);

      eh.file = eh.event + '/' + slug(eh.name) + '.js';
      var fullPath = workingDir + options.file + eh.file;

      var noIds = [];

      var found = false;

      self.blockLocal.event_handlers.forEach(function (value) {
        if (eh.id === value._id) {
          found = true;
          value = mergeEventHandler(value, eh);
        }

        if (!value._id) {
          noIds.push(value);
        }
      });

      var appendEH = function appendEH() {
        cli.info('Writing event handler to ' + fullPath);
        fs.outputFile(fullPath, eh.code, function () {
          cli.debug('writing eventHandler');
          self.blockLocal.event_handlers.push(mergeEventHandler({}, eh));
          holla();
        });
      };

      if (!found) {
        if (!noIds.length) {
          appendEH();
        } else {
          (function () {
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
                mergeEventHandler(self.blockLocal.event_handlers[answers.eh.index], eh);
                holla(null);
              }
            });
          })();
        }
      }
    }, function () {
      cli.debug('Writing event handlers to block.json to ' + blockFile);
      fs.outputJson(blockFile, self.blockLocal, { spaces: 4 }, cb);
    });
  };

  self.blockComplete = function (cb) {
    cli.debug('ensuring block in block.json is complete');

    updateBlock(self.blockLocal, false, function (data) {
      self.blockLocal = mergeBlock(self.blockLocal, data);

      cli.debug('Writing block.json to ' + blockFile);
      fs.outputJson(blockFile, self.blockLocal, { spaces: 4 }, cb);
    });
  };

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

  self.eventHandlerPush = function (cb) {
    cli.debug('eventHandlerPush');

    var update = function update(data, done) {
      var id = data._id;

      delete data._id;
      if (data.file) {
        delete data.file;
      }

      if (id) {
        api.updateEventHandler({ keyId: self.blockRemote.key_id, eventHandlerId: id, eventHandlerPayload: data }, done);
      } else {
        data.block_id = self.blockRemote.id;
        data.key_id = self.blockRemote.key_id;
        data.type = 'js';

        api.createEventHandler({ keyId: self.blockRemote.key_id, eventHandlerPayload: data }, done);
      }
    };

    async.each(self.blockLocal.event_handlers, function (eh, holla) {
      if (eh.file) {
        (function () {
          var fullPath = workingDir + options.file + eh.file;
          var testJson = workingDir + options.file + 'test.json';

          cli.info('Uploading event handler from ' + fullPath);
          fs.readFile(fullPath, 'utf8', function (err, data) {
            if (err) {
              holla(err.message);
            } else {
              if (fs.existsSync(testJson)) {
                (function () {
                  var testVars = JSON.parse(fs.readFileSync(testJson, 'utf8'));

                  Object.keys(testVars).forEach(function (key) {
                    data = data.replace(key, testVars[key]);
                  });
                })();
              }

              eh.code = data;

              update(eh, holla);
            }
          });
        })();
      } else {
        update(eh, holla);
      }
    }, cb);
  };

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
      functions: ['sessionFileGet', 'sessionGet', 'blockFileCreate', 'blockRead', 'keyGet', 'blockGet', 'blockWrite', 'eventHandlerWrite'],
      success: 'New block.json written to disk.'
    },
    push: {
      functions: ['sessionFileGet', 'sessionGet', 'blockRead', 'keyGet', 'blockGet', 'blockComplete', 'eventHandlerComplete', 'eventHandlerPush', 'blockPush'],
      success: 'Block pushed'
    },
    pull: {
      functions: ['sessionFileGet', 'sessionGet', 'requireInit', 'blockRead', 'keyGet', 'blockGet', 'blockWrite', 'eventHandlerWrite'],
      success: 'Local block.json updated with remote data.'
    },
    start: {
      functions: ['sessionFileGet', 'sessionGet', 'blockRead', 'keyGet', 'blockStart'],
      success: 'Block started'
    },
    stop: {
      functions: ['sessionFileGet', 'sessionGet', 'blockRead', 'blockStop'],
      success: 'Block stopped'
    }
  };

  routes[cli.command].functions.forEach(function (value) {
    tasks.push(self[value]);
  });

  async.series(tasks, function (err) {
    if (err) {
      if (err.code) {
        cli.error(err.code + ' - ' + (err.error || 'There was a problem with that request'));
      } else {
        cli.error(err);
      }
    } else {
      cli.ok('---------------------------------------');
      if (routes[cli.command].success) {
        cli.ok(routes[cli.command].success);
      }
      cli.ok('Deluxe!');
      cli.ok('---------------------------------------');

      explain();

      process.exit(0);
    }
  });

  return self;
});
//# sourceMappingURL=index.js.map
