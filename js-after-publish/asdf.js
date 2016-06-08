/*
 *  This is the function where the fun happens. You can do awesome stuff here
 *
 *    This event handler runs on after publish event. You can not modify the 
 *  message so subscribers will receive the original message only, but you
 *  can access the request attributes and message content (read only). 
 *  You can do lot of other things like publishing to some channel, 
 *  accessing third part APIs etc. but you can't modify the original 
 *  published message.
 *
 *    Other events available are before publish and after presence. Please 
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

    var pubnub = require('pubnub')


    /*
     * There are other awesome modules also like crypto, babel etc. For info
     * available here:

     # NEED TO PUT DOCUMENTATION URL HERE

     *
     */

     // var crypto = require('crypto');
     // var babel = require('babel');
    



    /*
     *  Since this is an after publish event hanlder, we can not modify the
     * message and subscribers will receive original version.
     *
     */

    try {

        /*
         * To demo the usage of after publish event handler, we will read 
         * original message, modify it and publish it on a different channel.
         * Our test case expects to receive the response on 
         *  + "-response" 
         * This is how a sample request looks like

            {  
              "verb":"publish",
              "pubkey":"blocks",
              "subkey":"blocks",
              "channels":[  
                "template-channel-after-publish"
              ],
              "message":{  
                "text":"demo"
              },
              "timetoken":null,
              "meta":{  
                "clientip":"127.0.0.1",
                "origin":"blocks_js-after-publish",
                "useragent":"Go-http-client/1.1",
                "ttl":4
              },
              "params":{  
                "uuid":"c92d66f0-c8b9-4f21-87a0-d611c4d7337c",
                "pnsdk":"PubNub-JS-Web/3.12.0"
              }
            }

         * 
         */

        var message = request.message;

        // response channel = incoming channel + "-response" 

        var response_channel = request.channels[0]  + "-response";


        /*
         * modify the message to be published on response channel
         * please note that original message remains unchanged since this
         * is after publish handler and message has already been published
         */

        message.text = "modified by after publish event handler";

        // publish on response channel

        pubnub.publish(response_channel, message);
        
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