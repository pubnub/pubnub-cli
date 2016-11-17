#! /usr/bin/env node
'use strict';

var _commander = require('commander');

var _commander2 = _interopRequireDefault(_commander);

var _package = require('../../package.json');

var _package2 = _interopRequireDefault(_package);

var _utils = require('../utils');

var _index = require('../index');

var _index2 = _interopRequireDefault(_index);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var entryPoint = new _index2.default({ isCLI: true });

_commander2.default.version(_package2.default.version).option('associate', 'associate the local block with a remote').command('init [operations]', 'perform intialization operations').command('session [operations]', 'perform operations related to sessions').parse(process.argv);

var operation = _commander2.default.rawArgs[2];

if (operation === 'associate') {
  entryPoint.associate({ folderPath: (0, _utils.createPath)(_commander2.default.rawArgs[3]) });
}
//# sourceMappingURL=cli.js.map
