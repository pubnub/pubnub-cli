'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _fs = require('fs');

var _fs2 = _interopRequireDefault(_fs);

var _path = require('path');

var _path2 = _interopRequireDefault(_path);

var _safe = require('colors/safe');

var _safe2 = _interopRequireDefault(_safe);

var _lodash = require('lodash');

var _lodash2 = _interopRequireDefault(_lodash);

var _inquirer = require('inquirer');

var _inquirer2 = _interopRequireDefault(_inquirer);

var _utils = require('../utils');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var VERSION = 1;

var _class = function () {
  function _class(_ref) {
    var logger = _ref.logger,
        networking = _ref.networking,
        _ref$interactive = _ref.interactive,
        interactive = _ref$interactive === undefined ? false : _ref$interactive;

    _classCallCheck(this, _class);

    this.logger = logger;
    this.networking = networking;
    this.interactive = interactive;
    this.blockManifestFile = 'block.json';
  }

  _createClass(_class, [{
    key: 'createBlock',
    value: function createBlock(_ref2) {
      var _this = this;

      var folderPath = _ref2.folderPath;

      if (!this.interactive) {
        this.logger.error('#createBlock not supported for non-interactive mode');
        return;
      }

      var existingManifest = null;

      try {
        existingManifest = _fs2.default.readFileSync(_path2.default.join(folderPath, this.blockManifestFile), 'utf-8');
      } catch (e) {}

      if (existingManifest !== null) {
        this.logger.error(_safe2.default.red(this.blockManifestFile + 'already exists. aborting initalization'));
        return;
      }

      var inputParams = [{
        field: null,
        name: 'name',
        question: 'Please enter the BLOCK name',
        type: 'input',
        default: _lodash2.default.kebabCase(_path2.default.basename(folderPath))
      }, {
        field: null,
        name: 'description',
        question: 'Please enter the BLOCK description',
        type: 'input'
      }, {
        field: null,
        name: 'license',
        question: 'Please enter the license type',
        type: 'input',
        default: 'ISC'
      }, {
        field: null,
        name: 'version',
        question: 'Please enter the inital version',
        type: 'input',
        default: '1.0.0'
      }];

      (0, _utils.abstractedValidator)(inputParams, this.interactive).then(function (fields) {
        _this.logger.info('About to create the following ' + _this.blockManifestFile + ' file \n' + JSON.stringify(fields, null, '\t'));

        _inquirer2.default.prompt({ type: 'boolean', name: 'okayToWrite', default: true, message: 'Good to write to file system?' }).then(function (result) {
          if (result.okayToWrite) {
            fields.dependencies = {};
            fields.version = VERSION;
            _fs2.default.writeFileSync(_path2.default.join(folderPath, _this.blockManifestFile), JSON.stringify(fields, null, 4));
            _this.logger.info(_this.blockManifestFile + 'file created at: ' + _path2.default.join(folderPath, _this.blockManifestFile));
          }
        });
      });
    }
  }, {
    key: 'createEventHandler',
    value: function createEventHandler(_ref3) {
      var _this2 = this;

      var folderPath = _ref3.folderPath;

      var srcFolder = _path2.default.join(folderPath, 'src');
      var templateFolder = _path2.default.join(__dirname, '../../templates');
      var jsTemplate = _fs2.default.readFileSync(_path2.default.join(templateFolder, 'eh.js'), 'utf8');

      if (!this.interactive) {
        this.logger.error('#createEventHandler not supported for non-interactive mode');
        return;
      }

      try {
        _fs2.default.statSync(srcFolder);
      } catch (e) {
        _fs2.default.mkdirSync(srcFolder);
      }

      var inputParams = [{
        field: null,
        name: 'name',
        question: 'Please enter the Event Handler name',
        type: 'input',
        validate: function validate(input) {
          return input !== '' && _lodash2.default.trim(input).length > 0;
        }
      }, {
        field: null,
        name: 'type',
        question: 'Please choose the event handler type',
        type: 'list',
        choices: ['Before Publish', 'After Publish', 'After Presence']
      }];

      (0, _utils.abstractedValidator)(inputParams, this.interactive).then(function (fields) {
        var handlerJSON = { name: _lodash2.default.kebabCase(fields.name), type: _lodash2.default.kebabCase(fields.type) };
        _fs2.default.writeFileSync(_path2.default.join(srcFolder, _lodash2.default.lowerCase(fields.name) + '.json'), JSON.stringify(handlerJSON, null, 4));
        _fs2.default.writeFileSync(_path2.default.join(srcFolder, _lodash2.default.lowerCase(fields.name) + '.js'), jsTemplate);
        _this2.logger.info('Created new event handler.');
      });
    }
  }]);

  return _class;
}();

exports.default = _class;
module.exports = exports['default'];
//# sourceMappingURL=init.js.map
