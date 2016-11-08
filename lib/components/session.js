'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _os = require('os');

var _os2 = _interopRequireDefault(_os);

var _fs = require('fs');

var _fs2 = _interopRequireDefault(_fs);

var _inquirer = require('inquirer');

var _inquirer2 = _interopRequireDefault(_inquirer);

var _lodash = require('lodash');

var _lodash2 = _interopRequireDefault(_lodash);

var _safe = require('colors/safe');

var _safe2 = _interopRequireDefault(_safe);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var _class = function () {
  function _class(_ref) {
    var logger = _ref.logger,
        networking = _ref.networking,
        _ref$interactive = _ref.interactive,
        interactive = _ref$interactive === undefined ? false : _ref$interactive;

    _classCallCheck(this, _class);

    this.logger = logger;
    this.networking = networking;
    this.sessionStorage = _os2.default.homedir() + '/.pubnub-cli';
    this.interactive = interactive;
  }

  _createClass(_class, [{
    key: 'checkSession',
    value: function checkSession() {
      var _this = this;

      var _ref2 = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {},
          userId = _ref2.userId,
          sessionToken = _ref2.sessionToken;

      var abstractedPromise = this.createPromise();

      new Promise(function (fulfill) {
        if (_this.interactive) {
          _this._fetchSessionFile().then(function (credentials) {
            fulfill(credentials);
          }).catch(function (error) {
            _this.logger.info('Session does not exist; credentials found failed to load', error);
            return;
          });
        } else {
          fulfill({ userId: userId, sessionToken: sessionToken });
        }
      }).then(function (credentials) {
        _this.networking.getApps({ sessionToken: credentials.sessionToken, ownerId: credentials.userId }, function (err, result) {
          if (_this.interactive) {
            if (result) _this.logger.info(_safe2.default.green('session is valid'));else _this.logger.info(_safe2.default.red('session is invalid'));
          } else {
            abstractedPromise.resolve({ sessionValid: result !== undefined });
          }
        });
      }).catch(function (error) {
        if (_this.interactive) _this.logger.error(error);else abstractedPromise.reject(error);
      });

      return abstractedPromise;
    }
  }, {
    key: 'createSession',
    value: function createSession(_ref3) {
      var _this2 = this;

      var email = _ref3.email,
          password = _ref3.password;

      var abstractedPromise = this.createPromise();
      var inputParams = [{
        field: email,
        name: 'email',
        question: 'Please enter your PubNub email',
        type: 'input'
      }, {
        field: password,
        name: 'password',
        question: 'Please enter your PubNub password',
        type: 'password'
      }];

      this.abstractedValidator(inputParams).then(function (fields) {
        _this2.networking.createLoginToken({ email: fields.email, password: fields.password }, function (err, serverResponse) {
          if (err) {
            if (_this2.interactive) _this2.logger.error(err);else abstractedPromise.reject(err);
            return;
          }

          var userId = serverResponse.result.user_id;
          var sessionToken = serverResponse.result.token;

          if (_this2.interactive) {
            _this2._createSessionFile({ userId: userId, sessionToken: sessionToken }).then(function () {
              _this2.logger.info('Login Succesful, token: ' + sessionToken + ' saved to home directory');
            });
          }
        });
      }).catch(function (err) {
        if (_this2.interactive) _this2.logger.error(err);else abstractedPromise.reject(err);
        return;
      });

      return abstractedPromise;
    }
  }, {
    key: 'createPromise',
    value: function createPromise() {
      var successResolve = void 0;
      var failureResolve = void 0;
      var promise = new Promise(function (fulfill, reject) {
        successResolve = fulfill;
        failureResolve = reject;
      });

      return { promise: promise, reject: failureResolve, resolve: successResolve };
    }
  }, {
    key: 'abstractedValidator',
    value: function abstractedValidator() {
      var _this3 = this;

      var params = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : [];

      var response = {};
      var validationPassing = true;
      var questions = [];

      params.forEach(function (param) {
        if (param.field && _lodash2.default.trim(param.field) !== '') {
          response[param.name] = _lodash2.default.trim(param.field);
        } else if (_this3.interactive) {
          questions.push({ type: param.type, name: param.name, message: param.question });
        } else {
          validationPassing = false;
        }
      });

      return new Promise(function (resolve, reject) {
        if (_this3.interactive) {
          if (questions.length === 0) return resolve(response);

          _inquirer2.default.prompt(questions).then(function (promptResult) {
            Object.assign(response, promptResult);
            resolve(response);
          });
        } else {
          if (validationPassing) resolve(response);else reject();
          return;
        }
      });
    }
  }, {
    key: 'deleteSession',
    value: function deleteSession() {
      var _this4 = this;

      return this._deleteSessonFile().then(function () {
        if (_this4.interactive) _this4.logger.info('PubNub Session Deleted');
      });
    }
  }, {
    key: '_fetchSessionFile',
    value: function _fetchSessionFile() {
      var _this5 = this;

      return new Promise(function (resolve) {
        _fs2.default.readFile(_this5.sessionStorage, 'utf8', function (err, data) {
          if (err) resolve({});else resolve(JSON.parse(data));
        });
      });
    }
  }, {
    key: '_createSessionFile',
    value: function _createSessionFile(_ref4) {
      var _this6 = this;

      var sessionToken = _ref4.sessionToken,
          userId = _ref4.userId;

      return this._deleteSessonFile().then(function () {
        return new Promise(function (resolve, reject) {
          _fs2.default.writeFile(_this6.sessionStorage, JSON.stringify({ sessionToken: sessionToken, userId: userId }), function (err) {
            if (err) reject(err);else resolve();
          });
        });
      });
    }
  }, {
    key: '_deleteSessonFile',
    value: function _deleteSessonFile() {
      var _this7 = this;

      return new Promise(function (resolve, reject) {
        _fs2.default.unlink(_this7.sessionStorage, function (err) {
          if (err && err.code !== 'ENOENT') reject(err);else resolve();
        });
      });
    }
  }]);

  return _class;
}();

exports.default = _class;
module.exports = exports['default'];
//# sourceMappingURL=session.js.map
