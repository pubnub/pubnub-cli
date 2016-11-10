'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.createPromise = createPromise;
exports.abstractedValidator = abstractedValidator;

var _inquirer = require('inquirer');

var _inquirer2 = _interopRequireDefault(_inquirer);

var _lodash = require('lodash');

var _lodash2 = _interopRequireDefault(_lodash);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function createPromise() {
  var successResolve = void 0;
  var failureResolve = void 0;
  var promise = new Promise(function (fulfill, reject) {
    successResolve = fulfill;
    failureResolve = reject;
  });

  return { promise: promise, reject: failureResolve, resolve: successResolve };
}

function abstractedValidator() {
  var params = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : [];
  var interactive = arguments[1];

  var response = {};
  var validationPassing = true;
  var questions = [];

  params.forEach(function (param) {
    if (param.field && _lodash2.default.trim(param.field) !== '') {
      response[param.name] = _lodash2.default.trim(param.field);
    } else if (interactive) {
      questions.push({ type: param.type, name: param.name, message: param.question, default: param.default });
    } else {
      validationPassing = false;
    }
  });

  return new Promise(function (resolve, reject) {
    if (interactive) {
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
//# sourceMappingURL=utils.js.map
