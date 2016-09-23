const request = require('request');
const colors = require('colors');

// this is a fix for bad SSL cert on portal gold
process.env.NODE_TLS_REJECT_UNAUTHORIZED = 0;

export default class {

  constructor(options) {
    this.options = options;
    this.endpoint = options.endpoint || 'https://portal1.gold.aws-pdx-3.ps.pn';
    this.session = false;
  }

  request(method, url, opts, holla) {
    if (url[1] !== 'me' && !this.session) {
      return this.errHandle('Authorize with init() first.');
    }

    opts = opts || {};

    opts.url = this.endpoint + '/' + url.join('/');
    opts.method = method;

    opts.json = true;
    opts.headers = opts.headers || {};
    opts.headers.Authorization = 'Basic cHVibnViLWJldGE6YmxvY2tzMjAxNg===';

    if (this.session) {
      opts.headers['X-Session-Token'] = this.session.token;
    }

    // clog('-- URL:'.yellow);
    this.clog(opts.method.red + ' ' + opts.url);
    this.clog('-- opts:'.yellow);
    this.clog(opts);

    request(opts, (err, response, body) => {
      if (response.statusCode !== 200) {
        const errorMessage = response.statusMessage || body.error || '';
        this.errHandle('Server replied with code ' + response.statusCode + ' ' + errorMessage);
        holla(err || body.message || body);
      } else {
        holla(err, body);
      }
    });
  }

  errHandle(text) {
    if (this.options.debug) {
      console.error(colors.red('API Error: ' + text)); // eslint-disable-line no-console
    }
  }

  clog(input) {
    if (this.options.debug) {
      if (typeof input === 'object') {
        console.log(input); // eslint-disable-line no-console
      } else {
        console.log('API:'.yellow, input); // eslint-disable-line no-console
      }
    }
  }

  getApps({ ownerId }, callback) {
    if (!ownerId) return callback('missing ownerId');

    const opts = { qs: { owner_id: ownerId } };
    this.request('get', ['api', 'apps'], opts, callback);
  }

  getBlocks({ keyId }, callback) {
    if (!keyId) return callback('missing keyId');

    this.request('get', ['api', 'v1', 'blocks', 'key', keyId, 'block'], {}, callback);
  }

  startBlock({ keyId, blockId }, callback) {
    if (!keyId) return callback('missing keyId');
    if (!blockId) return callback('missing blockId');

    this.request('post', ['api', 'v1', 'blocks', 'key', keyId, 'block', blockId, 'start'], {}, callback);
  }

  stopBlock({ keyId, blockId }, callback) {
    if (!keyId) return callback('missing keyId');
    if (!blockId) return callback('missing blockId');

    this.request('post', ['api', 'v1', 'blocks', 'key', keyId, 'block', blockId, 'stop'], {}, callback);
  }

  createBlock({ keyId, blockPayload }, callback) {
    if (!keyId) return callback('missing keyId');
    if (!blockPayload) return callback('missing blockPayload');

    const opts = { form: blockPayload };
    this.request('post', ['api', 'v1', 'blocks', 'key', keyId, 'block'], opts, callback);
  }

  updateBlock({ keyId, blockId, blockPayload }, callback) {
    if (!keyId) return callback('missing keyId');
    if (!blockId) return callback('missing blockId');
    if (!blockPayload) return callback('missing blockPayload');

    const opts = { form: blockPayload };
    this.request('put', ['api', 'v1', 'blocks', 'key', keyId, 'block', blockId], opts, callback);
  }

  createEventHandler({ keyId, eventHandlerPayload }, callback) {
    if (!keyId) return callback('missing keyId');
    if (!eventHandlerPayload) return callback('missing eventHandlerPayload');

    const opts = { form: eventHandlerPayload };
    this.request('post', ['api', 'v1', 'blocks', 'key', keyId, 'event_handler'], opts, callback);
  }

  updateEventHandler({ keyId, eventHandlerId, eventHandlerPayload }, callback) {
    if (!keyId) return callback('missing keyId');
    if (!eventHandlerId) return callback('missing eventHandlerId');
    if (!eventHandlerPayload) return callback('missing eventHandlerPayload');

    const opts = { form: eventHandlerPayload };
    this.request('put', ['api', 'v1', 'blocks', 'key', keyId, 'event_handler', eventHandlerId], opts, callback);
  }

  createLoginToken({ email, password }, callback) {
    if (!email) return callback('missing email');
    if (!password) return callback('missing password');

    const opts = { form: { email, password } };
    this.request('post', ['api', 'me'], opts, callback);
  }

  init(input, holla) {
    this.createLoginToken({ email: input.email, password: input.password }, (err, body) => {
      if (body && body.error) {
        holla(body.error);
      } else if (err) {
        holla(err.error);
      } else {
        this.session = body.result;
        holla(null, body);
      }
    });
  }
}
