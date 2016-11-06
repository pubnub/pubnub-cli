'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _os = require('os');

var _os2 = _interopRequireDefault(_os);

var _fs = require('fs');

var _fs2 = _interopRequireDefault(_fs);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var _class = function () {
  function _class(_ref) {
    var logger = _ref.logger,
        networking = _ref.networking;

    _classCallCheck(this, _class);

    this.logger = logger;
    this.networking = networking;
    this.sessionStorage = _os2.default.homedir() + '/.pubnub-cli';
  }

  _createClass(_class, [{
    key: 'deleteSession',
    value: function deleteSession() {
      var _this = this;

      return this._deleteSessonFile().then(function () {
        _this.logger.info('PubNub Session Deleted');
      });
    }
  }, {
    key: '_fetchSessionFile',
    value: function _fetchSessionFile() {
      var _this2 = this;

      return new Promise(function (resolve) {
        _fs2.default.readFile(_this2.sessionStorage, 'utf8', function (err, data) {
          if (err) _this2.logger.error(err);
          resolve(data);
        });
      });
    }
  }, {
    key: '_createSessionFile',
    value: function _createSessionFile(sessionToken) {
      var _this3 = this;

      return this._deleteSessonFile().then(function () {
        return new Promise(function (resolve) {
          _fs2.default.writeFile(_this3.sessionStorage, sessionToken, function (err) {
            if (err) _this3.logger.error(err);
            resolve();
          });
        });
      });
    }
  }, {
    key: '_deleteSessonFile',
    value: function _deleteSessonFile() {
      var _this4 = this;

      return new Promise(function (resolve) {
        _fs2.default.unlink(_this4.sessionStorage, function (err) {
          if (err) _this4.logger.error(err);
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
