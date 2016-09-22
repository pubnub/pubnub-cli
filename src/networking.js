const request = require('request');
const colors = require('colors');

// this is a fix for bad SSL cert on portal gold
process.env.NODE_TLS_REJECT_UNAUTHORIZED = 0;

const Client = function (options) {

  const self = this;

  const errHandle = function (text) {
    if (options.debug) {
      console.error(colors.red('API Error: ' + text)); // eslint-disable-line no-console
    }
  };

  const clog = function (input) {

    if (options.debug) {
      if (typeof input === 'object') {
        console.log(input); // eslint-disable-line no-console
      } else {
        console.log('API:'.yellow, input); // eslint-disable-line no-console
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
    opts.headers.Authorization = 'Basic cHVibnViLWJldGE6YmxvY2tzMjAxNg===';

    if (self.session) {
      opts.headers['X-Session-Token'] = self.session.token;
    }

    // clog('-- URL:'.yellow);
    clog(opts.method.red + ' ' + opts.url);
    clog('-- opts:'.yellow);
    clog(opts);

    request(opts, (err, response, body) => {
      if (response.statusCode !== 200) {
        errHandle('Server replied with code ' + response.statusCode + ' ' + response.statusMessage || body.error || '');
        holla(err || body.message || body);
      } else {
        holla(err, body);
      }
    });
  };

  self.getApps = function ({ ownerId }, callback) {
    if (!ownerId) return callback('missing ownerId');

    const opts = { qs: { owner_id: ownerId } };
    this.request('get', ['api', 'apps'], opts, callback);
  };

  self.getBlocks = function ({ keyId }, callback) {
    if (!keyId) return callback('missing keyId');

    this.request('get', ['api', 'v1', 'blocks', 'key', keyId, 'block'], {}, callback);
  };

  self.startBlock = function ({ keyId, blockId }, callback) {
    if (!keyId) return callback('missing keyId');
    if (!blockId) return callback('missing blockId');

    this.request('post', ['api', 'v1', 'blocks', 'key', keyId, 'block', blockId, 'start'], {}, callback);
  };

  self.stopBlock = function ({ keyId, blockId }, callback) {
    if (!keyId) return callback('missing keyId');
    if (!blockId) return callback('missing blockId');

    this.request('post', ['api', 'v1', 'blocks', 'key', keyId, 'block', blockId, 'stop'], {}, callback);
  };

  self.createBlock = function ({ keyId, blockPayload }, callback) {
    if (!keyId) return callback('missing keyId');
    if (!blockPayload) return callback('missing blockPayload');

    const opts = { form: blockPayload };
    this.request('post', ['api', 'v1', 'blocks', 'key', keyId, 'block'], opts, callback);
  };

  self.updateBlock = function ({ keyId, blockId, blockPayload }, callback) {
    if (!keyId) return callback('missing keyId');
    if (!blockId) return callback('missing blockId');
    if (!blockPayload) return callback('missing blockPayload');

    const opts = { form: blockPayload };
    this.request('put', ['api', 'v1', 'blocks', 'key', keyId, 'block', blockId], opts, callback);
  };

  self.createEventHandler = function ({ keyId, eventHandlerPayload }, callback) {
    if (!keyId) return callback('missing keyId');
    if (!eventHandlerPayload) return callback('missing eventHandlerPayload');

    const opts = { form: eventHandlerPayload };
    this.request('post', ['api', 'v1', 'blocks', 'key', keyId, 'event_handler'], opts, callback);
  };

  self.updateEventHandler = function ({ keyId, eventHandlerId, eventHandlerPayload }, callback) {
    if (!keyId) return callback('missing keyId');
    if (!eventHandlerId) return callback('missing eventHandlerId');
    if (!eventHandlerPayload) return callback('missing eventHandlerPayload');

    const opts = { form: eventHandlerPayload };
    this.request('put', ['api', 'v1', 'blocks', 'key', keyId, 'event_handler', eventHandlerId], opts, callback);
  };

  self.init = function (input, holla) {
    self.request('post', ['api', 'me'], {
      form: {
        email: input.email || errHandle('No Email Supplied'),
        password: input.password || errHandle('No Password Supplied')
      }
    }, (err, body) => {
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
