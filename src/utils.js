import inquirer from 'inquirer';
import _ from 'lodash';

export function createPromise() {
  let successResolve;
  let failureResolve;
  const promise = new Promise((fulfill, reject) => {
    successResolve = fulfill;
    failureResolve = reject;
  });

  return { promise, reject: failureResolve, resolve: successResolve };
}

export function abstractedValidator(params = [], interactive) {
  const response = {};
  let validationPassing = true; // optimism.
  const questions = [];

  params.forEach((param) => {
    if (param.field && _.trim(param.field) !== '') {
      response[param.name] = _.trim(param.field);
    } else if (interactive) {
      questions.push({ type: param.type, name: param.name, message: param.question, default: param.default });
    } else {
      validationPassing = false;
    }
  });

  return new Promise((resolve, reject) => {
    if (interactive) {
      if (questions.length === 0) return resolve(response);

      inquirer.prompt(questions).then((promptResult) => {
        Object.assign(response, promptResult);
        resolve(response);
      });
    } else {
      if (validationPassing) resolve(response);
      else reject(/* TODO */);
      return;
    }
  });
}
