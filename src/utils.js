import inquirer from 'inquirer';
import _ from 'lodash';
import path from 'path';

export function createPromise() {
  let successResolve;
  let failureResolve;
  const promise = new Promise((fulfill, reject) => {
    successResolve = fulfill;
    failureResolve = reject;
  });

  return { promise, reject: failureResolve, resolve: successResolve };
}

export function createPath(incomingPath) {
  let folderPath = '';

  if (incomingPath) {
    if (path.isAbsolute(incomingPath)) {
      folderPath = incomingPath;
    } else {
      path.join(process.cwd(), incomingPath);
    }
  } else {
    folderPath = path.join(process.cwd(), '.');
  }

  return folderPath;
}

export function abstractedValidator(params = [], interactive) {
  const response = {};
  let validationPassing = true; // optimism.
  const questions = [];

  const defaultValidator = (input) => {
    return (input !== '' && _.trim(input).length > 0);
  };

  params.forEach((param) => {
    if (param.field && _.trim(param.field) !== '') {
      response[param.name] = _.trim(param.field);
    } else if (interactive) {
      questions.push({
        type: param.type,
        name: param.name,
        message: param.question,
        default: param.default,
        validate: param.validate || defaultValidator,
        choices: param.choices
      });
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
