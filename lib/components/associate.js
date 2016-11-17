'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var _class = function () {
  function _class(_ref) {
    var logger = _ref.logger,
        networking = _ref.networking,
        sessionComponent = _ref.sessionComponent,
        _ref$interactive = _ref.interactive,
        interactive = _ref$interactive === undefined ? false : _ref$interactive;

    _classCallCheck(this, _class);

    this.logger = logger;
    this.networking = networking;
    this.sessionComponent = sessionComponent;
    this.interactive = interactive;
  }

  _createClass(_class, [{
    key: 'perform',
    value: function perform() {
      if (!this.interactive) {
        this.logger.error('#createBlock not supported for non-interactive mode');
        return;
      }

      this.sessionComponent.validateOrCreateSession().then(function (response) {
        console.log(response);
      }).catch(function (error) {
        console.log(error);
      });
    }
  }]);

  return _class;
}();

exports.default = _class;
module.exports = exports['default'];
//# sourceMappingURL=associate.js.map
