System.register(["inquirer", "lodash", "path", "~inquirer~es6-promise"], function (exports_1, context_1) {
    "use strict";
    var __moduleName = context_1 && context_1.id;
    function createPromise() {
        let successResolve;
        let failureResolve;
        const promise = new _inquirer_es6_promise_1.Promise((fulfill, reject) => {
            successResolve = fulfill;
            failureResolve = reject;
        });
        return { promise, reject: failureResolve, resolve: successResolve };
    }
    exports_1("createPromise", createPromise);
    function createPath(incomingPath) {
        let folderPath = '';
        if (incomingPath) {
            if (path_1.default.isAbsolute(incomingPath)) {
                folderPath = incomingPath;
            }
            else {
                path_1.default.join(process.cwd(), incomingPath);
            }
        }
        else {
            folderPath = path_1.default.join(process.cwd(), '.');
        }
        return folderPath;
    }
    exports_1("createPath", createPath);
    function abstractedValidator(params = [], interactive) {
        const response = {};
        let validationPassing = true;
        const questions = [];
        const defaultValidator = (input) => {
            return (input !== '' && lodash_1.default.trim(input).length > 0);
        };
        params.forEach((param) => {
            if (param.field && lodash_1.default.trim(param.field) !== '') {
                response[param.name] = lodash_1.default.trim(param.field);
            }
            else if (interactive) {
                questions.push({
                    type: param.type,
                    name: param.name,
                    message: param.message,
                    default: param.default,
                    validate: param.validate || defaultValidator,
                    choices: param.choices
                });
            }
            else {
                validationPassing = false;
            }
        });
        return new _inquirer_es6_promise_1.Promise((resolve, reject) => {
            if (interactive) {
                if (questions.length === 0)
                    return resolve(response);
                inquirer_1.default.prompt(questions).then((promptResult) => {
                    Object.assign(response, promptResult);
                    resolve(response);
                });
            }
            else {
                if (validationPassing)
                    resolve(response);
                else
                    reject();
                return;
            }
        });
    }
    exports_1("abstractedValidator", abstractedValidator);
    var inquirer_1, lodash_1, path_1, _inquirer_es6_promise_1;
    return {
        setters: [
            function (inquirer_1_1) {
                inquirer_1 = inquirer_1_1;
            },
            function (lodash_1_1) {
                lodash_1 = lodash_1_1;
            },
            function (path_1_1) {
                path_1 = path_1_1;
            },
            function (_inquirer_es6_promise_1_1) {
                _inquirer_es6_promise_1 = _inquirer_es6_promise_1_1;
            }
        ],
        execute: function () {
        }
    };
});
//# sourceMappingURL=utils.js.map