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
    key: 'createSession',
    value: function createSession(_ref2) {
      var _this = this;

      var email = _ref2.email,
          password = _ref2.password;

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

      var abstractedPromise = this.createPromise();

      this.abstractedValidator(inputParams).then(function (fields) {
        _this.networking.createLoginToken({ email: fields.email, password: fields.password }, function (err, serverResponse) {
          if (err) {
            if (_this.interactive) _this.logger.error(err);else abstractedPromise.reject(err);
            return;
          }

          var token = serverResponse.result.token;

          if (_this.interactive) {
            _this._createSessionFile(token).then(function () {
              _this.logger.info('Login Succesful, token: ' + token + ' saved to home directory');
            });
          }
        });
      }).catch(function (err) {
        if (_this.interactive) _this.logger.error(err);else abstractedPromise.reject(err);
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
      var _this2 = this;

      var params = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : [];

      var response = {};
      var validationPassing = true;
      var questions = [];

      params.forEach(function (param) {
        if (param.field && _lodash2.default.trim(param.field) !== '') {
          response[param.name] = _lodash2.default.trim(param.field);
        } else if (_this2.interactive) {
          questions.push({ type: param.type, name: param.name, message: param.question });
        } else {
          validationPassing = false;
        }
      });

      return new Promise(function (resolve, reject) {
        if (_this2.interactive) {
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
      var _this3 = this;

      return this._deleteSessonFile().then(function () {
        if (_this3.interactive) _this3.logger.info('PubNub Session Deleted');
      });
    }
  }, {
    key: '_fetchSessionFile',
    value: function _fetchSessionFile() {
      var _this4 = this;

      return new Promise(function (resolve) {
        _fs2.default.readFile(_this4.sessionStorage, 'utf8', function (err, data) {
          if (err) _this4.logger.error(err);
          resolve(data);
        });
      });
    }
  }, {
    key: '_createSessionFile',
    value: function _createSessionFile(sessionToken) {
      var _this5 = this;

      return this._deleteSessonFile().then(function () {
        return new Promise(function (resolve) {
          _fs2.default.writeFile(_this5.sessionStorage, sessionToken, function (err) {
            if (err) _this5.logger.error(err);
            resolve();
          });
        });
      });
    }
  }, {
    key: '_deleteSessonFile',
    value: function _deleteSessonFile() {
      var _this6 = this;

      return new Promise(function (resolve) {
        _fs2.default.unlink(_this6.sessionStorage, function (err) {
          if (err && err.code !== 'ENOENT') _this6.logger.error(err);
          resolve();
        });
      });
    }
  }]);

  return _class;
}();

exports.default = _class;
module.exports = exports['default'];
//# sourceMappingURL=session.js.map
