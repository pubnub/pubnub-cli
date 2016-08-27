

    var envs = require('./envs');

    if (!process.env.CONFIG) {
        console.error("Config file not provided.\n" + 
            "Please provide config file location via env variables\n" +
            "For ex. CONFIG=<config file path> node migrate.js");

        var format = 
            {
                "from":  {
                    "key": "<prod|gold|silver|bronze>",
                    "email": "<portal username>",
                    "password": "<portal password>",
                    "subscribe_key": "<subscribe key>"
                },
                "to": {
                    "email": "<portal username>",
                    "password": "<portal password>",
                    "subscribe_key": "<subscribe key>"
                }
            }
        console.error("Config file format is as below:\n");
        console.error(JSON.stringify(format, null, 2));
        process.exit(1);
    }
    var config = require('jsonfile').readFileSync(process.env.CONFIG);
    var async = require('async');
    var Mocha = require('mocha');
    var fs = require('fs');
    var path = require('path');

    process.env.ENV = config.to.key;


    // Instantiate a Mocha instance.
    var mocha = new Mocha();

    var testDir = process.env.CATALOG_DIR || '../blocks-catalog/catalog';


    function log(msg) {
        if (process.env.DEBUG) console.log(msg);
    }


    var api = {
        from: require('./lib/pubnub-api')({
            debug: process.env.DEBUG_HTTP,
            endpoint: envs[config.from.key].host
        }),
        to: require('./lib/pubnub-api')({
            debug: process.env.DEBUG_HTTP,
            endpoint: envs[config.to.key].host
        })
    };


    var skipList = [
        'email-sendgrid',
        'hello-world',
        'text-to-speech'
    ];

    var includeList = [];


    function initFrom(cb) {

        api.from.init({
            email: config.from.email,
            password: config.from.password

        }, function (err, body) {

            log('Logging In... Done!');

            if (err) {
                cb(err);
            } else {
                config.from.session = body.result;
                cb();
            }

        });
    }

    function initTo(cb) {

        api.to.init({
            email: config.to.email,
            password: config.to.password

        }, function (err, body) {

            log('Logging in ');
            if (err) {
                cb(err);
            } else {
                config.to.session = body.result;
                cb();
            }

        });
    }

    function getKeyId(a, conf, cb) {
        var givenKey = conf.subscribe_key;

        a.request('get', ['api', 'apps'], {
            qs: {
                owner_id: conf.session.user.id
            }
        }, function (err, data) {


            var paramKey = false;

            data.result.forEach(function (app) {

                app.keys.forEach(function (value) {

                    if (givenKey === value.subscribe_key) {
                        paramKey = value;
                    }

                });

            });

            if (!paramKey) {
                cb('Invalid key ID');
            } else {
                conf.subscribe_key_object = paramKey;
                cb();
            }

        });
    }

    function getFromKeyId(cb) {
        getKeyId(api.from, config.from, cb);
    }

    function getToKeyId(cb) {
        getKeyId(api.to, config.to, cb);
    }


    function getBlocks(a, conf, cb) {
        a.request('get', ['api', 'v1', 'blocks', 'key',
            conf.subscribe_key_object.id, 'block'], {

            }, function (err, data) {

                if (err) {
                    cb(err);
                } else {
                    conf.blocks = data.payload;
                    cb();
                }

            }
        );
    }

    function getFromBlocks(cb) {
        getBlocks(api.from, config.from, cb);
    }

    function getToBlocks(cb) {
        getBlocks(api.to, config.to, cb);
    }


    function getRelevantToBlocks() {


        var fromChannels = [];
        var fromBlockNames = [];

        config.from.blocks.forEach(function (block) {
            fromBlockNames.push(block.name);
            block.event_handlers.forEach(function (handler) {
                fromChannels.push(handler.channels);
            });
        });


        var blocks = {};


        config.to.blocks.forEach(function (block) {

            block.event_handlers.forEach(function (eh) {

                if (fromChannels.indexOf(eh.channels) >= 0) {

                    blocks[block.id] = 1; // getEhIds(block);
                }
            });

            if (fromBlockNames.indexOf(block.name) >= 0) {
                if (!blocks[block.id]) {
                    blocks[block.id] = 1;// getEhIds(block);
                }

            }

        });

        return blocks;
    }


    function deleteToBlocks(cb) {
        log('Delete To Blocks');


        var poll;

        var blocksToDelete = getRelevantToBlocks();


        var total = Object.keys(blocksToDelete).length;


        if (total === 0) {
            cb();
            return;
        }

        function done(e, blockId) {

            if (blocksToDelete[blockId]) {

                delete blocksToDelete[blockId];
            }

            if (e) {
                if (cb) cb(e);
                cb = null;
                if (poll) clearInterval(poll);
            }

            if (Object.keys(blocksToDelete).length === 0) {
                if (poll) clearInterval(poll);
                if (cb) cb();
                cb = null;

            }
        }


        setTimeout(function () {
            poll = setInterval(function () {
                Object.keys(blocksToDelete).forEach(function (blockId) {
                    api.to.request('get', ['api', 'v1', 'blocks', 'key',
                        config.to.subscribe_key_object.id, 'block',
                        blockId], {
                        }, function (err, data) {
                            if (err) return;

                            if (data.payload.length > 0) {
                                var b = data.payload[0];

                                if (b && b.state === 'stopped') {
                                    api.to.request('delete',
                                     ['api', 'v1', 'blocks', 'key',
                                    config.to.subscribe_key_object.id,
                                    'block', b.id], {
                                    }, function () {
                                    // done(err ? err.message : null, b.id);

                                    });

                                } else {
                                    api.to.request('post',
                                        ['api', 'v1', 'blocks', 'key',
                                    config.to.subscribe_key_object.id,
                                    'block',
                                    b.id, 'stop'], {

                                    }, function () {

                                    });
                                }
                            } else {
                                done(null, blockId);
                            }


                        });
                });

            }, 5000);


        }, 10000);


    }

    function pushBlocks(cb) {

        log('Push Blocks');
        var total = config.from.blocks.length;

        function done(err) {
            if (err) {
                cb(err);
                return;
            }
            if (--total === 0) cb(err);

        }

        config.from.blocks.forEach(function (block) {

            var b = {
                description: block.description,
                name: block.name,
                key_id: config.to.subscribe_key_object.id
            };

            api.to.request('post', ['api', 'v1', 'blocks', 'key',
                config.to.subscribe_key_object.id, 'block'], {
                    form: b
                }, function (err, data) {
                    // log(JSON.stringify(data));

                    if (!err) {
                        block.event_handlers.forEach(function (eh) {
                            var handler = {
                                name: eh.name,
                                type: eh.type || 'js',
                                description: eh.description || '',
                                event: eh.event,
                                channels: eh.channels,
                                output: eh.output,
                                log_level: eh.log_level || 'debug',
                                key_id: config.to.subscribe_key_object.id,
                                block_id: data.payload.id,
                                code: eh.code

                            };

                            api.to.request('post',
                                ['api', 'v1', 'blocks', 'key',
                                config.to.subscribe_key_object.id,
                                'event_handler'], {
                                    form: handler
                                }, function (error) {
                                    done(error);
                                });
                        });
                    } else {
                        // done(err);
                    }

                });


        });

    }


    function startToBlocks(cb) {
        log('Start To Blocks');


        var blocksToStart = getRelevantToBlocks();
        var total = Object.keys(blocksToStart).length;

        var poll;

        if (total === 0) {
            cb();
            return;
        }

        function done(e, blockId) {

            if (blocksToStart[blockId]) {

                delete blocksToStart[blockId];

            }

            if (e) {
                if (cb) cb(e);
                cb = null;
                if (poll) clearInterval(poll);
            }

            if (Object.keys(blocksToStart).length === 0) {
                if (poll) clearInterval(poll);
                if (cb) cb();
                cb = null;

            }
        }


        setTimeout(function () {
            poll = setInterval(function () {
                Object.keys(blocksToStart).forEach(function (blockId) {
                    api.to.request('get', ['api', 'v1', 'blocks', 'key',
                        config.to.subscribe_key_object.id, 'block',
                        blockId], {
                        }, function (err, data) {

                            if (err) return;

                            var b = data.payload[0];
                            if (b.state === 'stopped') {
                                api.to.request('post',
                                    ['api', 'v1', 'blocks', 'key',
                                config.to.subscribe_key_object.id, 'block',
                                b.id, 'start'], {
                                }, function () {

                                });
                            } else if (b.state === 'running') {
                                done(null, b.id);
                            }

                        });
                });

            }, 2000);


        }, 10000);

    }


    function runTests() {

        var channels = [];

        var blockNames = [];
        config.from.blocks.forEach(function (block) {
            blockNames.push(block.name);
        });


        config.from.blocks.forEach(function (block) {
            block.event_handlers.forEach(function (handler) {
                channels.push(handler.channels);
            });
        });


        // Add each .js file to the mocha instance
        fs.readdirSync(testDir).filter(function (file) {

            var blockJson = testDir + '/' + file + '/block.json';


            var block = require('jsonfile')
                            .readFileSync(blockJson);


            // if include list is enabled, run only tests on include list
            if (includeList && includeList.length > 0) {
                return (includeList.indexOf(file) >= 0);
            }

            // exclude blocks on exclude list

            return (blockNames.indexOf(block.name) >= 0 &&
                file[0] !== '.' && skipList.indexOf(file) < 0);

        }).forEach(function (blockDir) {

            mocha.addFile(
                path.join(testDir, blockDir, 'test.js')
            );

        });

        log('running tests');

        mocha.reporter('spec').run(function (failures) {
            process.exit(failures);

        });

    }


    function loop() {
        async.series([
            initFrom,
            initTo,
            getFromKeyId,
            getToKeyId,
            getFromBlocks,
            getToBlocks,
            deleteToBlocks,
            pushBlocks,
            getToBlocks,
            startToBlocks,
            runTests
        ], function (error) {

            if (error) {
                if (error.message &&
                    error.message.search(/ESOCKETTIMEDOUT|ETIMEDOUT/)
                        === -1) {
                    process.exit(1);
                } else {
                    loop();
                }
            } else {
                runTests();
            }

        });
    }

    loop();
