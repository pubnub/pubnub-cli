'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol ? "symbol" : typeof obj; };

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var _request = require('request');
var colors = require('colors');

process.env.NODE_TLS_REJECT_UNAUTHORIZED = 0;

var _class = function () {
  function _class(options) {
    _classCallCheck(this, _class);

    this.options = options;
    this.endpoint = options.endpoint || 'https://portal1.gold.aws-pdx-3.ps.pn';
    this.session = false;
  }

  _createClass(_class, [{
    key: 'request',
    value: function request(method, url, opts, holla) {
      var _this = this;

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

      this.clog(opts.method.red + ' ' + opts.url);
      this.clog('-- opts:'.yellow);
      this.clog(opts);

      _request(opts, function (err, response, body) {
        if (response.statusCode !== 200) {
          var errorMessage = response.statusMessage || body.error || '';
          _this.errHandle('Server replied with code ' + response.statusCode + ' ' + errorMessage);
          holla(err || body.message || body);
        } else {
          holla(err, body);
        }
      });
    }
  }, {
    key: 'errHandle',
    value: function errHandle(text) {
      if (this.options.debug) {
        console.error(colors.red('API Error: ' + text));
      }
    }
  }, {
    key: 'clog',
    value: function clog(input) {
      if (this.options.debug) {
        if ((typeof input === 'undefined' ? 'undefined' : _typeof(input)) === 'object') {
          console.log(input);
        } else {
          console.log('API:'.yellow, input);
        }
      }
    }
  }, {
    key: 'getApps',
    value: function getApps(_ref, callback) {
      var ownerId = _ref.ownerId;

      if (!ownerId) return callback('missing ownerId');

      var opts = { qs: { owner_id: ownerId } };
      this.request('get', ['api', 'apps'], opts, callback);
    }
  }, {
    key: 'getBlocks',
    value: function getBlocks(_ref2, callback) {
      var keyId = _ref2.keyId;

      if (!keyId) return callback('missing keyId');

      this.request('get', ['api', 'v1', 'blocks', 'key', keyId, 'block'], {}, callback);
    }
  }, {
    key: 'startBlock',
    value: function startBlock(_ref3, callback) {
      var keyId = _ref3.keyId;
      var blockId = _ref3.blockId;

      if (!keyId) return callback('missing keyId');
      if (!blockId) return callback('missing blockId');

      this.request('post', ['api', 'v1', 'blocks', 'key', keyId, 'block', blockId, 'start'], {}, callback);
    }
  }, {
    key: 'stopBlock',
    value: function stopBlock(_ref4, callback) {
      var keyId = _ref4.keyId;
      var blockId = _ref4.blockId;

      if (!keyId) return callback('missing keyId');
      if (!blockId) return callback('missing blockId');

      this.request('post', ['api', 'v1', 'blocks', 'key', keyId, 'block', blockId, 'stop'], {}, callback);
    }
  }, {
    key: 'createBlock',
    value: function createBlock(_ref5, callback) {
      var keyId = _ref5.keyId;
      var blockPayload = _ref5.blockPayload;

      if (!keyId) return callback('missing keyId');
      if (!blockPayload) return callback('missing blockPayload');

      var opts = { form: blockPayload };
      this.request('post', ['api', 'v1', 'blocks', 'key', keyId, 'block'], opts, callback);
    }
  }, {
    key: 'updateBlock',
    value: function updateBlock(_ref6, callback) {
      var keyId = _ref6.keyId;
      var blockId = _ref6.blockId;
      var blockPayload = _ref6.blockPayload;

      if (!keyId) return callback('missing keyId');
      if (!blockId) return callback('missing blockId');
      if (!blockPayload) return callback('missing blockPayload');

      var opts = { form: blockPayload };
      this.request('put', ['api', 'v1', 'blocks', 'key', keyId, 'block', blockId], opts, callback);
    }
  }, {
    key: 'createEventHandler',
    value: function createEventHandler(_ref7, callback) {
      var keyId = _ref7.keyId;
      var eventHandlerPayload = _ref7.eventHandlerPayload;

      if (!keyId) return callback('missing keyId');
      if (!eventHandlerPayload) return callback('missing eventHandlerPayload');

      var opts = { form: eventHandlerPayload };
      this.request('post', ['api', 'v1', 'blocks', 'key', keyId, 'event_handler'], opts, callback);
    }
  }, {
    key: 'updateEventHandler',
    value: function updateEventHandler(_ref8, callback) {
      var keyId = _ref8.keyId;
      var eventHandlerId = _ref8.eventHandlerId;
      var eventHandlerPayload = _ref8.eventHandlerPayload;

      if (!keyId) return callback('missing keyId');
      if (!eventHandlerId) return callback('missing eventHandlerId');
      if (!eventHandlerPayload) return callback('missing eventHandlerPayload');

      var opts = { form: eventHandlerPayload };
      this.request('put', ['api', 'v1', 'blocks', 'key', keyId, 'event_handler', eventHandlerId], opts, callback);
    }
  }, {
    key: 'createLoginToken',
    value: function createLoginToken(_ref9, callback) {
      var email = _ref9.email;
      var password = _ref9.password;

      if (!email) return callback('missing email');
      if (!password) return callback('missing password');

      var opts = { form: { email: email, password: password } };
      this.request('post', ['api', 'me'], opts, callback);
    }
  }, {
    key: 'init',
    value: function init(input, holla) {
      var _this2 = this;

      this.createLoginToken({ email: input.email, password: input.password }, function (err, body) {
        if (body && body.error) {
          holla(body.error);
        } else if (err) {
          holla(err.error);
        } else {
          _this2.session = body.result;
          holla(null, body);
        }
      });
    }
  }]);

  return _class;
}();

exports.default = _class;
module.exports = exports['default'];
//# sourceMappingURL=networking.js.map
