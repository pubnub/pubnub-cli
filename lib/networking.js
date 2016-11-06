'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var _request = require('request');

process.env.NODE_TLS_REJECT_UNAUTHORIZED = 0;

var _class = function () {
  function _class(_ref) {
    var endpoint = _ref.endpoint,
        logger = _ref.logger;

    _classCallCheck(this, _class);

    this.logger = logger;
    this.endpoint = endpoint;
  }

  _createClass(_class, [{
    key: 'updateSessionToken',
    value: function updateSessionToken(newSessionToken) {
      this.sessionToken = newSessionToken;
    }
  }, {
    key: 'request',
    value: function request(method, url, opts, callback) {
      var _this = this;

      opts = opts || {};

      opts.url = this.endpoint + '/' + url.join('/');
      opts.method = method;

      opts.json = true;
      opts.headers = opts.headers || {};

      if (this.sessionToken) {
        opts.headers['X-Session-Token'] = this.sessionToken;
      }

      _request(opts, function (err, response, body) {
        if (response.statusCode !== 200 || err) {
          _this.logger.error('HTTP Request Failed', { method: method, url: url, opts: opts, err: err, response: response, body: body });
          callback(_this._prepareErrorResponse({ err: err, response: response, body: body }));
        } else {
          _this.logger.debug('HTTP Request Successful', { method: method, url: url, opts: opts, err: err, response: response });
          callback(null, body);
        }
      });
    }
  }, {
    key: 'getApps',
    value: function getApps(_ref2, callback) {
      var ownerId = _ref2.ownerId;

      if (!ownerId) return callback('missing ownerId');
      if (!this.sessionToken) return callback('missing sessionToken');

      var opts = { qs: { owner_id: ownerId } };
      this.request('get', ['api', 'apps'], opts, callback);
    }
  }, {
    key: 'getBlocks',
    value: function getBlocks(_ref3, callback) {
      var keyId = _ref3.keyId;

      if (!keyId) return callback('missing keyId');
      if (!this.sessionToken) return callback('missing sessionToken');

      this.request('get', ['api', 'v1', 'blocks', 'key', keyId, 'block'], {}, callback);
    }
  }, {
    key: 'startBlock',
    value: function startBlock(_ref4, callback) {
      var keyId = _ref4.keyId,
          blockId = _ref4.blockId;

      if (!keyId) return callback('missing keyId');
      if (!blockId) return callback('missing blockId');
      if (!this.sessionToken) return callback('missing sessionToken');

      this.request('post', ['api', 'v1', 'blocks', 'key', keyId, 'block', blockId, 'start'], {}, callback);
    }
  }, {
    key: 'stopBlock',
    value: function stopBlock(_ref5, callback) {
      var keyId = _ref5.keyId,
          blockId = _ref5.blockId;

      if (!keyId) return callback('missing keyId');
      if (!blockId) return callback('missing blockId');
      if (!this.sessionToken) return callback('missing sessionToken');

      this.request('post', ['api', 'v1', 'blocks', 'key', keyId, 'block', blockId, 'stop'], {}, callback);
    }
  }, {
    key: 'createBlock',
    value: function createBlock(_ref6, callback) {
      var keyId = _ref6.keyId,
          blockPayload = _ref6.blockPayload;

      if (!keyId) return callback('missing keyId');
      if (!blockPayload) return callback('missing blockPayload');
      if (!this.sessionToken) return callback('missing sessionToken');

      var opts = { form: blockPayload };
      this.request('post', ['api', 'v1', 'blocks', 'key', keyId, 'block'], opts, callback);
    }
  }, {
    key: 'updateBlock',
    value: function updateBlock(_ref7, callback) {
      var keyId = _ref7.keyId,
          blockId = _ref7.blockId,
          blockPayload = _ref7.blockPayload;

      if (!keyId) return callback('missing keyId');
      if (!blockId) return callback('missing blockId');
      if (!blockPayload) return callback('missing blockPayload');
      if (!this.sessionToken) return callback('missing sessionToken');

      var opts = { form: blockPayload };
      this.request('put', ['api', 'v1', 'blocks', 'key', keyId, 'block', blockId], opts, callback);
    }
  }, {
    key: 'createEventHandler',
    value: function createEventHandler(_ref8, callback) {
      var keyId = _ref8.keyId,
          eventHandlerPayload = _ref8.eventHandlerPayload;

      if (!keyId) return callback('missing keyId');
      if (!eventHandlerPayload) return callback('missing eventHandlerPayload');
      if (!this.sessionToken) return callback('missing sessionToken');

      var opts = { form: eventHandlerPayload };
      this.request('post', ['api', 'v1', 'blocks', 'key', keyId, 'event_handler'], opts, callback);
    }
  }, {
    key: 'updateEventHandler',
    value: function updateEventHandler(_ref9, callback) {
      var keyId = _ref9.keyId,
          eventHandlerId = _ref9.eventHandlerId,
          eventHandlerPayload = _ref9.eventHandlerPayload;

      if (!keyId) return callback('missing keyId');
      if (!eventHandlerId) return callback('missing eventHandlerId');
      if (!eventHandlerPayload) return callback('missing eventHandlerPayload');
      if (!this.sessionToken) return callback('missing sessionToken');

      var opts = { form: eventHandlerPayload };
      this.request('put', ['api', 'v1', 'blocks', 'key', keyId, 'event_handler', eventHandlerId], opts, callback);
    }
  }, {
    key: 'createLoginToken',
    value: function createLoginToken(_ref10, callback) {
      var email = _ref10.email,
          password = _ref10.password;

      if (!email) return callback('missing email');
      if (!password) return callback('missing password');

      var opts = { form: { email: email, password: password } };
      this.request('post', ['api', 'me'], opts, callback);
    }
  }, {
    key: '_prepareErrorResponse',
    value: function _prepareErrorResponse(_ref11) {
      var err = _ref11.err,
          response = _ref11.response,
          body = _ref11.body;

      var constructedError = {
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
  }]);

  return _class;
}();

exports.default = _class;
module.exports = exports['default'];
//# sourceMappingURL=networking.js.map
