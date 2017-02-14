import inquirer from 'inquirer';
import _ from 'lodash';
import path from 'path';
// import {Promise} from "~inquirer~es6-promise";
import {Promise} from "es6-promise";
import {Question} from "inquirer";
import {PNQuestion} from "./defs";

type PromiseObject = { promise: Promise<any>, reject: (err: any) => any, resolve: (val: any) => any };

export function createPromise(): PromiseObject {
  let successResolve;
  let failureResolve;
  const promise = new Promise((fulfill, reject) => {
    successResolve = fulfill;
    failureResolve = reject;
  });

  return { promise, reject: failureResolve, resolve: successResolve };
}

export function createPath(incomingPath: string) {
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

export function abstractedValidator(params: Array<Question> = [], interactive: boolean) {
  const response: any = {};
  let validationPassing = true; // optimism.
  const questions: Array<Question> = [];

  const defaultValidator = (input: any) => {
    return (input !== '' && _.trim(input).length > 0);
  };

  params.forEach((param: PNQuestion) => {
    if (param.field && _.trim(param.field) !== '') {
      response[param.name] = _.trim(param.field);
    } else if (interactive) {
      questions.push({
        type: param.type,
        name: param.name,
        message: param.message,
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
