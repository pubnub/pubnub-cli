// Blocks-API Client

// https://gist.github.com/parasyte/bc041e79b0fc61801eaf36c42fc7b06a
// https://github.com/pubnub/pubnub-portal-client/blob/blocks-integration/blocks-integration-overview.md
// https://sites.google.com/a/pubnub.com/product/engineering/portal/apis-for-provisioning-keys

var request = require('request');
var colors = require('colors');

// this is a fix for bad SSL cert on portal gold
process.env.NODE_TLS_REJECT_UNAUTHORIZED = 0;

var Client = function (options) {

    var self = this;

    var errHandle = function (text) {
        if (options.debug) {
            console.error(colors.red('API Error: ' + text));
        }
    };

    var clog = function (input) {

        if (options.debug) {
            if (typeof(input) === 'object') {
                console.log(input);
            } else {
                console.log('API:'.yellow, input);
            }
        }
    };

    options = options || {};

    self.endpoint = options.endpoint || 'https://portal1.gold.aws-pdx-3.ps.pn';

    self.session = false;

    self.request = function (method, url, opts, holla) {

        if (url[1] !== 'me' && !self.session) {
            return errHandle('Authorize with init() first.');
        }

        opts = opts || {};

        opts.url = self.endpoint + '/' + url.join('/');
        opts.method = method;

        opts.json = true;
        opts.headers = opts.headers || {};

        if (self.session) {
            opts.headers['X-Session-Token'] = self.session.token;
        }

        // clog('-- URL:'.yellow);
        clog(opts.method.red + ' ' + opts.url);
        clog('-- opts:'.yellow);
        clog(opts);

        request(opts, function (err, response, body) {

            if (response.statusCode !== 200) {
                errHandle('Server replied with code '
                    + response.statusCode + ' '
                    + response.statusMessage || body.error || '');
                holla(err || body.message || body);
            } else {
                holla(err, body);
            }

        });

    };

    self.init = function (input, holla) {

        self.request('post', ['api', 'me'], {
            form: {
                email: input.email || errHandle('No Email Supplied'),
                password: input.password || errHandle('No Password Supplied')
            }
        }, function (err, body) {

            if (body && body.error) {
                holla(body.error);
            } else if (err) {
                holla(err.error);
            } else {
                self.session = body.result;
                holla(null, body);
            }

        });

    };

    return self;

};

module.exports = function (data) {
    return new Client(data);
};
