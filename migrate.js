    var envs = require('./envs'); 
    var config = require('./migration_config');
    var async = require('async');

    var PUBNUB = require('pubnub');

    var Mocha = require('mocha'),
        fs = require('fs'),
        path = require('path');


    // Instantiate a Mocha instance.
    var mocha = new Mocha();

    var testDir = process.argv[2] || '../blocks-catalog/catalog';


    function merror(msg, cb, param) {
        console.error(msg);
        process.exit(1);
        //cb(param);
    }


    function log(msg) {
        if (process.env.DEBUG) console.log(msg);
    }


    var api = {
        from : require('./lib/pubnub-api')({
            debug: process.env.DEBUG_HTTP,
            endpoint: envs[config.from.key].host
        }),
        to : require('./lib/pubnub-api')({
            debug: process.env.DEBUG_HTTP,
            endpoint: envs[config.to.key].host
        })
    };


    var skipList = [
        'anti-spam',
        'hangman',
        'fire-sensor-alert',
        'email-sendgrid',
        'hello-world',
        'text-to-speech',
        'vote-counter',
        'kvtest'
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

    function getKeyId(api, config, cb) {
        var givenKey = config.subscribe_key;

        api.request('get', ['api', 'apps'], {
            qs: {
                owner_id: config.session.user.id
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
                config.subscribe_key_object = paramKey;
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


    function getBlocks(api, config, cb) {
        api.request('get', ['api', 'v1', 'blocks', 'key', 
            config.subscribe_key_object.id, 'block'], {

        }, function (err, data) {
                
                if (err) {
                    cb(err);
                }

                else {
                    config.blocks = data.payload;
                    cb()
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

    function printConfig(cb) {
        log(JSON.stringify(config, null, 2));
        cb();
    }

    function deleteToBlocks(cb) {
        log('Delete To Blocks');

        var fromChannels = [];
        var fromBlockNames = [];

        config.from.blocks.forEach(function(block){
            fromBlockNames.push(block.name);
            block.event_handlers.forEach(function(handler){
                fromChannels.push(handler.channels);
            });
        });


        
        // after it starts
        // we need to subscribe to the channel to see output
        var pubnub = PUBNUB.init({
            subscribe_key: config.to.subscribe_key,
            publish_key: config.to.publish_key,
            origin: envs[config.to.key].origin
        });

        var channels = [];

        log(fromChannels);

        config.to.blocks.forEach(function(block){

            block.event_handlers.forEach(function(eh){
                log(eh.channels);
                if (fromChannels.indexOf(eh.channels) >= 0) {

                    var channel = 'blocks-state-'
                        + config.to.subscribe_key_object.properties.realtime_analytics_channel
                        + '.' + block.id;

                    if (channels.indexOf(channel) < 0)  channels.push(channel);   
                }
            })

            if (fromBlockNames.indexOf(block.name) >= 0) {
                var channel = 'blocks-state-'
                        + config.to.subscribe_key_object.properties.realtime_analytics_channel
                        + '.' + block.id;

                if (channels.indexOf(channel) < 0)  channels.push(channel); 
            }

        });

        var total = channels.length;
        log(total);

        if (total == 0) {
            cb();
            return;
        }

        function done(e) {
            if (e) {
                cb(e);
                return;
            }
            if (--total == 0) cb();
        }

        
        // subscribe to status channel
        pubnub.subscribe({
            channel: channels,
            connect: function(c) {

                var blockId = c.split('.')[1];

                api.to.request('get', ['api', 'v1', 'blocks', 'key', 
                    config.to.subscribe_key_object.id, 'block', blockId], {

                }, function (err, data) {
                   // log(JSON.stringify(data));


                    
                    if (err) {
                        done(err);
                    }

                    else {
                        var b = data.payload[0];


                        if (b.state === 'stopped') {
                            api.to.request('delete', ['api', 'v1', 'blocks', 'key',
                                config.to.subscribe_key_object.id, 'block', 
                                b.id], {
                            }, function (err, data) {
                                //log('Deleted ' + JSON.stringify(err));
                                //log(JSON.stringify(data));
                                done(err ? err.message : null); 
                                //done();
                            });
                        } else {
                            api.to.request('post', ['api', 'v1', 'blocks', 'key',
                                config.to.subscribe_key_object.id, 'block',
                                blockId, 'stop'], {

                                }, function (err) {
                                    //log('stopped ' + JSON.stringify(err));
                            });
                        }
                    }   

                });
                
            },

            message: function (m) {

                if (m.state === 'running') {
                    //console.log('running');
                } else if (m.state === 'stopped') {

                    //console.log('Block State: ' + m.state);
                    
                    api.to.request('delete', ['api', 'v1', 'blocks', 'key',
                        config.to.subscribe_key_object.id, 'block', 
                        m.block_id], {

                        }, function (err, data) {
                            log('Deleted');
                            if (err) log(JSON.stringify(data));
                            done(err ? err.message : null);
                        }
                    );
                    

                } else {
                    if (m.state !== 'pending') {
                        //console.log('Block State: ' + m.state + '...');
                    }
                }

            },
            error: function (error) {
                // Handle error here
                cb(JSON.stringify(error));
            }
        }); 
        
        //});
    }

    function pushBlocks(cb) {

        log('Push Blocks');
        var total = config.from.blocks.length;

        function done(err) {
            if (err) {
                cb(err); 
                return;
            }
            if (--total == 0) cb(err);
  
        }
        
        config.from.blocks.forEach(function(block){

            var b =   { 
                description: block.description,
                name: block.name,
                key_id: config.to.subscribe_key_object.id
             };

            api.to.request('post', ['api', 'v1', 'blocks', 'key',
                config.to.subscribe_key_object.id, 'block'], {
                    form: b
                }, function (err, data) {
                    //log(JSON.stringify(data));

                    if (!err) {
                        block.event_handlers.forEach(function(eh){
                            var handler = {
                                "name": eh.name,
                                "type": eh.type || 'js',
                                "description": eh.description || "",
                                "event": eh.event,
                                "channels": eh.channels,
                                "output": eh.output ,
                                "log_level": eh.log_level || "debug",
                                "key_id": config.to.subscribe_key_object.id,
                                "block_id": data.payload.id,
                                "code": eh.code

                            };

                            api.to.request('post', ['api', 'v1', 'blocks', 'key',
                                config.to.subscribe_key_object.id, 'event_handler'], {
                                    form: handler
                                }, function(err, data) {
                                    if (err) console.log(err + ' : ' + JSON.stringify(data));
                                    done(err);
                                });
                        });
                    } else {
                        done(err);
                    }
                        
                });

     
        });

    }


    function startToBlocks(cb) {
        log('Start To Blocks');

        var total = config.to.blocks.length;

        var fromChannels = [];
        var fromBlockNames = [];
        config.from.blocks.forEach(function(block){
            fromBlockNames.push(block.name);
            block.event_handlers.forEach(function(handler){
                fromChannels.push(handler.channels);
            });
        });

        var blocksToStart = {};

        var poll;

        if (total == 0) {
            cb();
            return;
        }

        function done(e, id) {
            console.log(e + ' : ' + id);

            if (blocksToStart[id]) {

                blocksToStart[id] -= 1;
                if (blocksToStart[id] == 0) {
                    delete blocksToStart[id];
                }
            }

            console.log(JSON.stringify(blocksToStart));
            if (e) {
                cb && cb(e);
                cb = null;
                poll && clearInterval(poll);
            }

            if (Object.keys(blocksToStart).length == 0) {
                poll && clearInterval(poll);
                cb && cb();
                cb =  null;

            }
        }




        config.to.blocks.forEach(function(block){

            block.event_handlers.forEach(function(eh){

                if (fromChannels.indexOf(eh.channels) >= 0) {


                    if (!blocksToStart[block.id]) {
                        blocksToStart[block.id] = 0;
                    }
                    blocksToStart[block.id] += 1;

                }
            })

        });


        setTimeout(function(){
            poll = setInterval(function(){
                Object.keys(blocksToStart).forEach(function(block_id){
                    api.to.request('get', ['api', 'v1', 'blocks', 'key',
                        config.to.subscribe_key_object.id, 'block', 
                        block_id], {
                    }, function (err, data) {

                        if (err) return;

                        var b = data.payload[0];
                        b.event_handlers.forEach(function(eh){

                            if (eh.state === 'running') {
                                 done(null, block_id);
                            }
                        });

                    });
                });

            }, 2000);


        }, 10000);


        Object.keys(blocksToStart).forEach(function(blockId){
            api.to.request('get', ['api', 'v1', 'blocks', 'key', 
                config.to.subscribe_key_object.id, 'block', blockId], {

            }, function (err, data) {
               // log(JSON.stringify(data));


                    
                    if (err) {
                        done(err, blockId);
                    } else {
                        var b = data.payload[0];
                        console.log(JSON.stringify(b));
                        if (b.event_handlers.length == 0) console.log(JSON.stringify(b));

                        if (b.state === 'stopped') {
                            api.to.request('post', ['api', 'v1', 'blocks', 'key',
                                config.to.subscribe_key_object.id, 'block', 
                                b.id, 'start'], {
                            }, function (err, data) {
                                //done(err ? err.message : null); 
                                //done();
                                console.log(err);
                                console.log(JSON.stringify(data));
                            });
                        } else if (b.state === 'running') {
                            done(null, b.id);
                        }
                    }   

                }
            );

        });

    }




    function runTests(cb) {

        var channels = [];

        var blockNames = [];
        config.from.blocks.forEach(function(block){
            blockNames.push(block.name);
        });


        config.from.blocks.forEach(function(block){
            block.event_handlers.forEach(function(handler){
                channels.push(handler.channels);
            });
        });



        var blockDirs = fs.readdirSync(testDir);


        // Add each .js file to the mocha instance
        fs.readdirSync(testDir).filter(function(file){

            var blockJson = testDir + '/' + file + '/' + 'block.json';


            var block = require('jsonfile')
                            .readFileSync(blockJson);


            // if include list is enabled, run only tests on include list
            if (includeList && includeList.length > 0) {
                return (includeList.indexOf(file) >= 0);
            }

            // exclude blocks on exclude list

            return (blockNames.indexOf(block.name) >= 0 &&  file[0] !== '.' && skipList.indexOf(file) < 0);

        }).forEach(function(blockDir){

            mocha.addFile(
                path.join(testDir, blockDir , 'test.js')
            );
            
        });


        log('running tests');

        mocha.reporter('spec').run(function(failures){

          process.exit(failures);


        });


   
    }


    /*

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
        //prepareTests,
        runTests//,
        //printConfig
    ], function (err) {
        if (err) {
            console.log(JSON.stringify(err));
            // display our error if one is thrown
            if (err.code) {

            } else {

            }
            process.exit(1);
        } else {

            // forceful exit
            process.exit(0);
        }
    });
    */


    void function loop() {
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
        startToBlocks
      ], function(error, results) {
          console.log(JSON.stringify(error));
          console.log(JSON.stringify(results));
          if (error) {
            if (error.message && error.message.search(/ESOCKETTIMEDOUT|ETIMEDOUT/) == -1) {

            } else {
                console.log('DO LOOP');
                loop();
            }
          } else {

            runTests();

          }

      });
    }();
