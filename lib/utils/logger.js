'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var winston = require('winston');

var _class = function () {
  function _class(_ref) {
    var logLevel = _ref.logLevel;

    _classCallCheck(this, _class);

    this.logger = new winston.Logger({
      level: logLevel || 'error'
    });

    this.logger.add(winston.transports.Console, {
      prettyPrint: true,
      colorize: true,
      silent: false,
      timestamp: false
    });
  }

  _createClass(_class, [{
    key: 'logPendingNetworkEvent',
    value: function logPendingNetworkEvent(data) {
      data.state = 'pending';
      this.logger.debug(data);
    }
  }, {
    key: 'logFailedNetworkEvent',
    value: function logFailedNetworkEvent(data) {
      data.state = 'failed';
      this.logger.debug(data);
    }
  }, {
    key: 'logSuccessfulNetworkEvent',
    value: function logSuccessfulNetworkEvent(data) {
      data.state = 'success';
      this.logger.debug(data);
    }
  }]);

  return _class;
}();

exports.default = _class;
module.exports = exports['default'];
//# sourceMappingURL=logger.js.map
