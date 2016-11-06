'use strict';

var _commander = require('commander');

var _commander2 = _interopRequireDefault(_commander);

var _winston = require('winston');

var _winston2 = _interopRequireDefault(_winston);

var _networking = require('./networking');

var _networking2 = _interopRequireDefault(_networking);

var _session = require('./components/session');

var _session2 = _interopRequireDefault(_session);

var _package = require('../package.json');

var _package2 = _interopRequireDefault(_package);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var logger = new _winston2.default.Logger({
  transports: [new _winston2.default.transports.Console()]
});

var networking = new _networking2.default({ endpoint: 'https://admin.pubnub.com', logger: logger });

var sessionComponent = new _session2.default({ networking: networking, logger: logger });

sessionComponent._createSessionFile('max');

_commander2.default.version(_package2.default.version).parse(process.argv);
//# sourceMappingURL=index.js.map
