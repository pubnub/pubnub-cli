var async = require('async');
var client = require('./index.js')({
	debug: true
});

async.waterfall([
  function(callback) {
      
  	// Authenticate with an email and password to receive a session_token. The session_token is used for all requests after authentication. You also receive a user_id which is used in as well in .
  	// Login
  	// POST https://admin.pubnub.com/api/me HTTP/1.1
  	// Authorization: Basic cHVibnViLWJldGE6YmxvY2tzMjAxNg==
  	// { "email" : "<email>", "password" : "<password>” }

    client.init({
    	email: "ian@meetjennings.com",
    	password: process.env.PASSWORD
    }, callback);

  },
  function(user, callback) {

	// Apps
	// GET https://admin.pubnub.com/api/apps?owner_id=<user_id> HTTP/1.1
	// X-Session-Token: <session_token>
	// Authorization: Basic cHVibnViLWJldGE6YmxvY2tzMjAxNg==

  	client.request('get', ['api', 'apps'], {
  		qs: {
  			owner_id: client.session.user.id
  		}
  	}, callback);

  },
  function(apps, callback) {

	// Blocks
	// GET /api/v1/blocks/key/100226/block HTTP/1.1
	// X-Session-Token: <session_token>
	// Authorization: Basic cHVibnViLWJldGE6YmxvY2tzMjAxNg==

  	client.request('get', ['api', 'v1', 'blocks', 'key', apps.result[7].keys[2].id, 'block'], {}, function(err, blocks){
  		callback(err, apps, blocks);
  	})

  },
  function(apps, blocks, callback) {


  	// Event Handler
  	// GET /api/v1/blocks/key/100226/block/34?token=<session_token> HTTP/1.1
  	// X-Session-Token: <session_token>
  	// Authorization: Basic cHVibnViLWJldGE6YmxvY2tzMjAxNg==

  	// console.log(blocks.payload[0])

  	client.request('post', ['api', 'v1', 'blocks', 'key', apps.result[7].keys[2].id, 'block', blocks.payload[0].id, 'start'], {}, callback)

    }

], function (err, result) {

	console.log('block has been started!!');

});



// Create Event Handler
// POST /api/v1/blocks/key/100226/event_handler HTTP/1.1
// X-Session-Token: <session_token>
// Authorization: Basic cHVibnViLWJldGE6YmxvY2tzMjAxNg==

// {"key_id":100226,"name":"New Event Handler","block_id":"34","type":"js","event":"js-after-presence","code":"function process(request) {\n var console = require(\"console\");\n\n try {\n // Add extra awesome here...\n\n return request;\n }\n catch (e) {\n console.error(\"Uncaught exception:\", e);\n\n // Add extra error handling here...\n }\n}","log_level":"debug","output":"output-0.5823105682419438","channels":"pubnub-sensor-network”}

// Update Event Handler
// PUT /api/v1/blocks/key/100226/event_handler/78 HTTP/1.1
// X-Session-Token: <session_token>
// Authorization: Basic cHVibnViLWJldGE6YmxvY2tzMjAxNg==

// {"block_id":34,"channel_groups":null,"channels":"pubnub-sensor-network","code":"function process(request) {\n var console = require(\"console\");\n\n try {\n // Add extra awesome here...\n\n return request;\n }\n catch (e) {\n console.error(\"Uncaught exception:\", e);\n\n // Add extra error handling here...\n }\n}","create_user_id":194894,"created_date":null,"event":"js-after-presence","id":78,"log_level":"debug","modified_date":null,"modified_user_id":0,"name":"New Event Handler","order_index":0,"output":"output-0.5823105682419438","rate":null,"state":"stopped","status":1,"type":"js","key_id":100226}

// Start Block
// POST /api/v1/blocks/key/100226/block/34/start HTTP/1.1
// X-Session-Token: <session_token>
// Authorization: Basic cHVibnViLWJldGE6YmxvY2tzMjAxNg==

// {"block_id":34,"key_id":100226,"action”:"start”}

// Stop Block
// POST /api/v1/blocks/key/100226/block/34/stop HTTP/1.1
// X-Session-Token: <session_token>
// Authorization: Basic cHVibnViLWJldGE6YmxvY2tzMjAxNg==

// {"block_id":34,"key_id":100226,"action":"stop”}