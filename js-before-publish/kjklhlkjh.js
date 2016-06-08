/*
 *  This is the function where the fun happens. You can do awesome stuff here
 *
 *    This event handler runs on before publish event. You can modify the 
 *  message and the subscribers will receive the modified messaged.
 *
 *    Other events available are after publish and after presence. Please 
 *  checkout event handlers code in respective directories to know more.
 *
 */

function process(request) {

    /*
     * require console module for logging to console
     */
    var console = require('console');

    /*
     * Following modules are also available. Just uncomment the ones you 
     * wanna use. Remove the double slashes :)
     */


     /*
      * xhr modules provides you with http client functionality. It can be
      * used for making synchronous and asynchrnonous http requests. The 
      * syntax is similar to using xhr with promises. Some usage examples are
      * as follows.
      
      * Synchronous GET
      
        xhr.fetch('http://pubsub.pubnub.com/time/0')
        .then(
            function(r){    // success
                console.log(r);
            },
            function(e) {   // errror
                console.error(r);
            }
        )
        .catch(function(e){
            console.log(e);
        })
        .done();

      * Asynchronous GET

        xhr.fetch('http://pubsub.pubnub.com/time/0')
        .then(
            function(r){    // success
                console.log(r);
            },
            function(e) {   // errror
                console.error(r);
            }
        )
        .catch(function(e){
            console.log(e);
        });

      * Synchronous POST

        var payload =  JSON.stringify({"a": "b"});

        var httpOptions = {
            "as": "json"
            ,"headers": {
                "Content-Type": "application/json"
                ,"Accept": "application/json"
            },
            "body": payload,
            "method" : 'post'
        };

        var path = ;
        
        xhr.fetch(path, httpOptions)
        .then(
            function(r){    // success
                console.log(r);
            },
            function(e) {   // errror
                console.error(r);
            }
        )
        .catch(function(e){
            console.log(e);
        })
        .done();
                
      * Asynchronous POST

        var payload =  JSON.stringify({"a": "b"});

        var httpOptions = {
            "as": "json"
            ,"headers": {
                "Content-Type": "application/json"
                ,"Accept": "application/json"
            },
            "body": payload,
            "method" : 'post' // this can be 'get', 'post', 'put'
                              // default is 'get'
        };

        var path = ;
        
        xhr.fetch(path, httpOptions)
        .then(
            function(r){    // success
                console.log(r);
            },
            function(e) {   // errror
                console.error(r);
            }
        )
        .catch(function(e){
            console.log(e);
        });
      
      *
      */

    // var xhr = require('xhr');



     /*
      * state module provides simple key value store.

      *  Usage:
      
      state.set("a", { "b" : 1}); // key is string, value can be JSON

      var a = state.get("a");

      *
      */

    // var state = require('state')



     /*
      * pubnub module in blocks provides some basic functionalities for 
      * writing blocks event handlers. As of now publish, and time methods
      * are available for usage. You can do both sync and async calls for 
      * publish. By default they use pub and sub keys uses are same as that 
      * of your block


      *  Async

      pubnub.publish(, , function(r){
        console.log(r);
      })

      * Sync

      var r = pubnub.publish(, );
      var r = pubnub.time();

      *
      */

    // var pubnub = require('pubnub')


    /*
     * There are other awesome modules also like crypto, babel etc. For info
     * available here:

     # NEED TO PUT DOCUMENTATION URL HERE

     *
     */

     // var crypto = require('crypto');
     // var babel = require('babel');
    



    /*
     *  Since this is a before publish event hanlder, we can modify the
     * message and subscribers will receive modified version.
     *
     */

    try {

        /*
         * we'll just add a new key named text with value "demo" as a demo :)
         * You can do any modification to your message, just be sure to 
         * return request. Its expected that request.message is the modified
         * value.
         * This is how a sample request looks like

            {
                "verb": "publish",
                "pubkey": "blocks",
                "subkey": "blocks",
                "channels": "template-channel-after-presence-pnpres",
                "message": {
                    "action": "join",
                    "timestamp": 1463763278,
                    "uuid": "d5a51913-c0ce-4edb-a88f-e8284cf3ab1a",
                    "occupancy": 1,
                    "c": "template-channel-after-presence-pnpres",
                    "pt": "14637632788233704"
                },
                "timetoken": null,
                "meta": null,
                "params": null
            }
         * 
         */

        var activity_record = state.get('activity_record');

        var record_for_uuid = activity_record[request.message.uuid] || [];
        record_for_uuid.push(request.message.action, 
          request.message.timestamp);

        activity_record[request.message.uuid] = record_for_uuid;

        state.set('activity_record', activity_record);

        pubnub.publish(response_channel, activity_record);
        
        return request;
    }
    catch (e) {
        /*
         * This is the place for exception handling.
         * Be sure to make best use of this ;)
         */
        console.error('Uncaught exception:', e);
    }
}