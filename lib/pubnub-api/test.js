var async = require('async');
var client = require('./index.js')({
    debug: true
});

async.waterfall([
    function (callback) {

        // Authenticate with an email and password to receive a session_token.
        // The session_token is used for all requests after authentication.
        // You also receive a user_id which is used in as well in .

        // Login
        // POST https://admin.pubnub.com/api/me HTTP/1.1
        // Authorization: Basic cHVibnViLWJldGE6YmxvY2tzMjAxNg==
        // { "email" : "<email>", "password" : "<password>” }

        client.init({
            email: 'ian@meetjennings.com',
            password: process.env.PASSWORD
        }, callback);

    },
    function (user, callback) {

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
    function (apps, callback) {

        // Blocks
        // GET /api/v1/blocks/key/100226/block HTTP/1.1
        // X-Session-Token: <session_token>
        // Authorization: Basic cHVibnViLWJldGE6YmxvY2tzMjAxNg==

        client.request('get', ['api', 'v1', 'blocks', 'key',
            apps.result[7].keys[2].id, 'block'], {}, function (err, blocks) {
                callback(err, apps, blocks);
            }
        );

    },
    function (apps, blocks, callback) {


        // Event Handler
        // GET /api/v1/blocks/key/100226/block/34?token=
        //  <session_token> HTTP/1.1
        // X-Session-Token: <session_token>
        // Authorization: Basic cHVibnViLWJldGE6YmxvY2tzMjAxNg==

        // console.log(blocks.payload[0])

        client.request('post', ['api', 'v1', 'blocks', 'key',
            apps.result[7].keys[2].id, 'block',
            blocks.payload[0].id, 'start'], {}, callback);

    }

], function () {

    console.log('block has been started!!');

});
