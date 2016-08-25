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



var apiFrom = require('./lib/pubnub-api')({
    debug: true,
    endpoint: envs[config.from.key].host
});


var apiTo = require('./lib/pubnub-api')({
    debug: true,
    endpoint: envs[config.to.key].host
});


function initFrom(cb) {

    apiFrom.init({
        email: config.from.email,
        password: config.from.password

    }, function (err, body) {

        console.log('Logging In... Done!');

        if (err) {
            cb(err);
        } else {
            config.from.session = body.result;
            cb();
        }

    });
}

function initTo(cb) {

    apiTo.init({
        email: config.to.email,
        password: config.to.password

    }, function (err, body) {

        console.log('Logging in ');
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

        // we need to map the key id to the key object
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
            //console.log(paramKey);
            config.subscribe_key_object = paramKey;
            cb();
        }

    });
}

function getFromKeyId(cb) {
    getKeyId(apiFrom, config.from, cb);
}

function getToKeyId(cb) {
    getKeyId(apiTo, config.to, cb);
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
    getBlocks(apiFrom, config.from, cb);
}

function getToBlocks(cb) {
    getBlocks(apiTo, config.to, cb);
}

function printConfig(cb) {
    console.log(JSON.stringify(config, null, 2));
    cb();
}

function deleteToBlocks(cb) {
    console.log('Delete To Blocks');

    var total = config.to.blocks.length;
    console.log(total);

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
    


    // after it starts
    // we need to subscribe to the channel to see output
    var pubnub = PUBNUB.init({
        subscribe_key: config.to.subscribe_key,
        publish_key: config.to.publish_key,
        origin: envs[config.to.key].origin
    });

    var channels = [];

    config.to.blocks.forEach(function(block){
        channels.push('blocks-state-'
            + config.to.subscribe_key_object.properties.realtime_analytics_channel
            + '.' + block.id);
    });

        /*
        apiTo.request('delete', ['api', 'v1', 'blocks', 'key',
            config.from.subscribe_key_object.id, 'block', 
            block.id], {

            }, function (err) {
                console.log('Deleted ' + JSON.stringify(err));
                done(err ? err.message : null);
            }
        );
        */


        

        // the channel is crazy
        //var chan = 'blocks-state-'
        //    + config.to.subscribe_key_object.properties.realtime_analytics_channel
        //    + '.' + block.id;


        // subscribe to status channel
    pubnub.subscribe({
        channel: channels,
        connect: function(c) {
            //console.log('Connect to  ' + c);  
            var blockId = c.split('.')[1];

            apiTo.request('get', ['api', 'v1', 'blocks', 'key', 
                config.to.subscribe_key_object.id, 'block', blockId], {

            }, function (err, data) {
               // console.log(JSON.stringify(data));


                    
                    if (err) {
                        done(err);
                    }

                    else {
                        var b = data.payload[0];


                        if (b.state === 'stopped') {
                            apiTo.request('delete', ['api', 'v1', 'blocks', 'key',
                                config.to.subscribe_key_object.id, 'block', 
                                b.id], {
                            }, function (err, data) {
                                console.log('Deleted ' + JSON.stringify(err));
                                console.log(JSON.stringify(data));
                                //done(err ? err.message : null); 
                                done();
                            });
                        } else {
                            apiTo.request('post', ['api', 'v1', 'blocks', 'key',
                                config.to.subscribe_key_object.id, 'block',
                                blockId, 'stop'], {

                                }, function (err) {
                                    console.log('stopped ' + JSON.stringify(err));
                                    //done(err ? err.message : null);
                                    /* if (err) {
                                        apiTo.request('delete', ['api', 'v1', 'blocks', 'key',
                                            config.to.subscribe_key_object.id, 'block', 
                                            blockId], {
                                        }, function (err) {
                                            console.log('Deleted');
                                            done(err ? err.message : null);
                                        });
                                    } */
                            });
                        }
                    }   

                }
            );
            //console.log(blockId);

            /*
            apiTo.request('post', ['api', 'v1', 'blocks', 'key',
                config.to.subscribe_key_object.id, 'block',
                blockId, 'stop'], {

                }, function (err) {
                    console.log('stopped ' + JSON.stringify(err));
                    //done(err ? err.message : null);
                    if (err) {
                        apiTo.request('delete', ['api', 'v1', 'blocks', 'key',
                            config.to.subscribe_key_object.id, 'block', 
                            blockId], {
                        }, function (err) {
                            console.log('Deleted');
                            done(err ? err.message : null);
                    }
                );
                

                    }
                }
            );
            */
            
        },

        message: function (m) {

            if (m.state === 'running') {
                console.log('running');
            } else if (m.state === 'stopped') {

                console.log('Block State: ' + m.state);
                
                apiTo.request('delete', ['api', 'v1', 'blocks', 'key',
                    config.to.subscribe_key_object.id, 'block', 
                    m.block_id], {

                    }, function (err) {
                        console.log('Deleted');
                        done(err ? err.message : null);
                    }
                );
                

            } else {
                if (m.state !== 'pending') {
                    console.log('Block State: ' + m.state + '...');
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

    console.log('Push Blocks');
    var total = config.from.blocks.length;

    function done(err) {
        if (--total == 0) cb(err);
        if (err) cb(err);   
    }
    
    config.from.blocks.forEach(function(block){

        var b =   { 
            description: block.description,
            name: block.name,
            key_id: config.to.subscribe_key_object.id
         };

        apiTo.request('post', ['api', 'v1', 'blocks', 'key',
            config.to.subscribe_key_object.id, 'block'], {
                form: b
            }, function (err, data) {
                console.log(JSON.stringify(data));


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

                    apiTo.request('post', ['api', 'v1', 'blocks', 'key',
                        config.to.subscribe_key_object.id, 'event_handler'], {
                            form: handler
                        }, function(err) {
                            done(err);
                        });
                });
                    
            });

 
    });

}


function startToBlocks(cb) {
    console.log('Start To Blocks');

    var total = config.to.blocks.length;
    console.log(total);

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
    


    // after it starts
    // we need to subscribe to the channel to see output
    var pubnub = PUBNUB.init({
        subscribe_key: config.to.subscribe_key,
        publish_key: config.to.publish_key,
        origin: envs[config.to.key].origin
    });

    var channels = [];

    config.to.blocks.forEach(function(block){
        channels.push('blocks-state-'
            + config.to.subscribe_key_object.properties.realtime_analytics_channel
            + '.' + block.id);
    });


    // subscribe to status channel
    pubnub.subscribe({
        channel: channels,
        connect: function(c) {
            //console.log('Connect to  ' + c);  
            var blockId = c.split('.')[1];

            apiTo.request('get', ['api', 'v1', 'blocks', 'key', 
                config.to.subscribe_key_object.id, 'block', blockId], {

            }, function (err, data) {
               // console.log(JSON.stringify(data));


                    
                    if (err) {
                        done(err);
                    }

                    else {
                        var b = data.payload[0];


                        if (b.state === 'stopped') {
                            apiTo.request('post', ['api', 'v1', 'blocks', 'key',
                                config.to.subscribe_key_object.id, 'block', 
                                b.id, 'start'], {
                            }, function (err, data) {
                                console.log('Deleted ' + JSON.stringify(err));
                                console.log(JSON.stringify(data));
                                //done(err ? err.message : null); 
                                //done();
                            });
                        } else if (b.state === 'running') {
                            done();
                        }
                    }   

                }
            );
            
        },

        message: function (m) {

            if (m.state === 'running') {
                console.log('running');
                done();
            } else if (m.state === 'stopped') {
                console.log('Block State: ' + m.state);

            } else {
                if (m.state !== 'pending') {
                    console.log('Block State: ' + m.state + '...');
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




function runTests(cb) {

    var channels = [];

    var skip = ['email-sendgrid', 'hello-world', 'text-to-speech']

    //config.to.blocks   for now read  config.from

    config.from.blocks.forEach(function(block){
        block.event_handlers.forEach(function(handler){
            channels.push(handler.channels);
        });
    });
    //console.log(channels);

    //console.log(testDir);
    // Add each .js file to the mocha instance
    var blockDirs = fs.readdirSync(testDir);


    // Add each .js file to the mocha instance
    fs.readdirSync(testDir).filter(function(file){
        // Only keep the .js files
        return ( file[0] !== '.' && skip.indexOf(file) < 0);

    }).forEach(function(blockDir){
        var blockJson = testDir + '/' + blockDir + '/' + 'block.json';
        //console.log(blockJson);
        
        var found = false;

        var block = require('jsonfile')
                        .readFileSync(blockJson);
        
        block.event_handlers.forEach(function(handler){
            if (channels.indexOf(handler.channels) >= 0 ) {
                console.log(handler.channels);
                found = true;
            }

        });

        if (found) {
            console.log(path.join(testDir, blockDir , 'test.js'));
            mocha.addFile(
                path.join(testDir, blockDir , 'test.js')
            );
        }
        
    });
    console.log('running tests');
            // Run the tests.

       

        mocha.fullTrace().globals().ignoreLeaks().reporter('spec').run(function(failures){

          console.log('hi');

          console.log(failures);
          /*
          process.on('exit', function () {
            process.exit(failures);  // exit with non-zero status if there were failures
          });
            */
        });


    
    blockDirs.forEach(function(file){

        //console.log(JSON.stringify(block, null, 2));

    });
    


    /*

    // Add each .js file to the mocha instance
    fs.readdirSync(testDir).filter(function(file){
        // Only keep the .js files
        return file.substr(-3) === 'test.js';

    }).forEach(function(file){
        mocha.addFile(
            path.join(testDir, file)
        );
    });

    // Run the tests.
    mocha.run(function(failures){
      process.on('exit', function () {
        process.exit(failures);  // exit with non-zero status if there were failures
      });
    });

    */

    cb();
}




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