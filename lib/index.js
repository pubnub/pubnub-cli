'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _winston = require('winston');

var _winston2 = _interopRequireDefault(_winston);

var _networking = require('./networking');

var _networking2 = _interopRequireDefault(_networking);

var _session = require('./components/session');

var _session2 = _interopRequireDefault(_session);

var _init = require('./components/init');

var _init2 = _interopRequireDefault(_init);

var _associate = require('./components/associate');

var _associate2 = _interopRequireDefault(_associate);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var _class = function _class() {
  var isCLI = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : false;

  _classCallCheck(this, _class);

  this.logger = new _winston2.default.Logger({
    transports: [new _winston2.default.transports.Console()]
  });

  this.networking = new _networking2.default({ endpoint: 'https://admin.pubnub.com', logger: this.logger });

  this.initComponent = new _init2.default({ networking: this.networking, logger: this.logger, interactive: isCLI });
  this.sessionComponent = new _session2.default({ networking: this.networking, logger: this.logger, interactive: isCLI });
  this.associateComponent = new _associate2.default({ networking: this.networking, sessionComponent: this.sessionComponent, logger: this.logger, interactive: isCLI });

  this.associate = this.associateComponent.perform.bind(this.associateComponent);

  this.init = {
    block: this.initComponent.createBlock.bind(this.initComponent),
    handler: this.initComponent.createEventHandler.bind(this.initComponent)
  };

  this.session = {
    check: this.sessionComponent.checkSession.bind(this.sessionComponent),
    create: this.sessionComponent.createSession.bind(this.sessionComponent),
    delete: this.sessionComponent.deleteSession.bind(this.sessionComponent)
  };
};

exports.default = _class;
module.exports = exports['default'];
//# sourceMappingURL=index.js.map
