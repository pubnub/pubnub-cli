const request = require('request');
const colors = require('colors/safe');

// this is a fix for bad SSL cert on portal gold
process.env.NODE_TLS_REJECT_UNAUTHORIZED = 0;

export default class {

  constructor({ endpoint, logLevel }) {
    this.logLevel = logLevel;
    this.endpoint = endpoint;
  }

  updateSessionToken(newSessionToken) {
    this.sessionToken = newSessionToken;
  }

  request(method, url, opts, callback) {
    opts = opts || {};

    opts.url = this.endpoint + '/' + url.join('/');
    opts.method = method;

    opts.json = true;
    opts.headers = opts.headers || {};
    opts.headers.Authorization = 'Basic cHVibnViLWJldGE6YmxvY2tzMjAxNg===';

    if (this.sessionToken) {
      opts.headers['X-Session-Token'] = this.sessionToken;
    }

    if (this.logLevel === 'debug') {
      const pendingNetworking = JSON.stringify({ state: 'pending', method, url, opts }, null, 2);
      console.log('\n', colors.gray(pendingNetworking), '\n'); // eslint-disable-line no-console
    }

    request(opts, (err, response, body) => {
      if (response.statusCode !== 200 || err) {
        if (this.logLevel === 'debug') {
          const pendingNetworking = JSON.stringify({ state: 'failed', method, url, opts, err, response, body }, null, 2);
          console.log('\n', colors.red(pendingNetworking), '\n'); // eslint-disable-line no-console
        }

        callback(this._prepareErrorResponse({ err, response, body }));
      } else {
        if (this.logLevel === 'debug') {
          const pendingNetworking = JSON.stringify({ state: 'success', method, url, opts, err, response }, null, 2);
          console.log('\n', colors.green(pendingNetworking), '\n'); // eslint-disable-line no-console
        }

        callback(null, body);
      }
    });
  }

  getApps({ ownerId }, callback) {
    if (!ownerId) return callback('missing ownerId');
    if (!this.sessionToken) return callback('missing sessionToken');

    const opts = { qs: { owner_id: ownerId } };
    this.request('get', ['api', 'apps'], opts, callback);
  }

  getBlocks({ keyId }, callback) {
    if (!keyId) return callback('missing keyId');
    if (!this.sessionToken) return callback('missing sessionToken');

    this.request('get', ['api', 'v1', 'blocks', 'key', keyId, 'block'], {}, callback);
  }

  startBlock({ keyId, blockId }, callback) {
    if (!keyId) return callback('missing keyId');
    if (!blockId) return callback('missing blockId');
    if (!this.sessionToken) return callback('missing sessionToken');

    this.request('post', ['api', 'v1', 'blocks', 'key', keyId, 'block', blockId, 'start'], {}, callback);
  }

  stopBlock({ keyId, blockId }, callback) {
    if (!keyId) return callback('missing keyId');
    if (!blockId) return callback('missing blockId');
    if (!this.sessionToken) return callback('missing sessionToken');

    this.request('post', ['api', 'v1', 'blocks', 'key', keyId, 'block', blockId, 'stop'], {}, callback);
  }

  createBlock({ keyId, blockPayload }, callback) {
    if (!keyId) return callback('missing keyId');
    if (!blockPayload) return callback('missing blockPayload');
    if (!this.sessionToken) return callback('missing sessionToken');

    const opts = { form: blockPayload };
    this.request('post', ['api', 'v1', 'blocks', 'key', keyId, 'block'], opts, callback);
  }

  updateBlock({ keyId, blockId, blockPayload }, callback) {
    if (!keyId) return callback('missing keyId');
    if (!blockId) return callback('missing blockId');
    if (!blockPayload) return callback('missing blockPayload');
    if (!this.sessionToken) return callback('missing sessionToken');

    const opts = { form: blockPayload };
    this.request('put', ['api', 'v1', 'blocks', 'key', keyId, 'block', blockId], opts, callback);
  }

  createEventHandler({ keyId, eventHandlerPayload }, callback) {
    if (!keyId) return callback('missing keyId');
    if (!eventHandlerPayload) return callback('missing eventHandlerPayload');
    if (!this.sessionToken) return callback('missing sessionToken');

    const opts = { form: eventHandlerPayload };
    this.request('post', ['api', 'v1', 'blocks', 'key', keyId, 'event_handler'], opts, callback);
  }

  updateEventHandler({ keyId, eventHandlerId, eventHandlerPayload }, callback) {
    if (!keyId) return callback('missing keyId');
    if (!eventHandlerId) return callback('missing eventHandlerId');
    if (!eventHandlerPayload) return callback('missing eventHandlerPayload');
    if (!this.sessionToken) return callback('missing sessionToken');

    const opts = { form: eventHandlerPayload };
    this.request('put', ['api', 'v1', 'blocks', 'key', keyId, 'event_handler', eventHandlerId], opts, callback);
  }

  createLoginToken({ email, password }, callback) {
    if (!email) return callback('missing email');
    if (!password) return callback('missing password');

    const opts = { form: { email, password } };
    this.request('post', ['api', 'me'], opts, callback);
  }

  _prepareErrorResponse({ err, response, body }) {
    const constructedError = {
      statusCode: null,
      message: null,
      errorCode: null
    };

    if (response && response.statusCode) {
      constructedError.statusCode = response.statusCode;
    }

    if (body) {
      if (body.error) constructedError.message = body.error;
      if (body.error_code) constructedError.errorCode = body.error_code;
    } else {
      constructedError.message = err;
    }

    return constructedError;
  }
}