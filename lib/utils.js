"use strict";
const inquirer_1 = require("inquirer");
const lodash_1 = require("lodash");
const path_1 = require("path");
const es6_promise_1 = require("es6-promise");
function createPromise() {
    let successResolve;
    let failureResolve;
    const promise = new es6_promise_1.Promise((fulfill, reject) => {
        successResolve = fulfill;
        failureResolve = reject;
    });
    return { promise, reject: failureResolve, resolve: successResolve };
}
exports.createPromise = createPromise;
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
exports.createPath = createPath;
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
    return new es6_promise_1.Promise((resolve, reject) => {
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
exports.abstractedValidator = abstractedValidator;
