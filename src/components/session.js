import os from 'os';
import fs from 'fs';
import inquirer from 'inquirer';
import _ from 'lodash';

export default class {

  constructor({ logger, networking, interactive = false }) {
    this.logger = logger;
    this.networking = networking;
    this.sessionStorage = os.homedir() + '/.pubnub-cli';
    this.interactive = interactive;
  }

  createSession({ email, password }) {
    const inputParams = [
      {
        field: email,
        name: 'email',
        question: 'Please enter your PubNub email',
        type: 'input'
      },
      {
        field: password,
        name: 'password',
        question: 'Please enter your PubNub password',
        type: 'password'
      }
    ];

    const abstractedPromise = this.createPromise();

    this.abstractedValidator(inputParams).then((fields) => {
      this.networking.createLoginToken({ email: fields.email, password: fields.password }, (err, serverResponse) => {
        if (err) {
          if (this.interactive) this.logger.error(err);
          else abstractedPromise.reject(err);
          return;
        }

        const token = serverResponse.result.token;

        if (this.interactive) {
          this._createSessionFile(token).then(() => {
            this.logger.info('Login Succesful, token: ' + token + ' saved to home directory');
          });
        }
      });
    }).catch((err) => {
      if (this.interactive) this.logger.error(err);
      else abstractedPromise.reject(err);
      return;
    });

    return abstractedPromise;
  }

  createPromise() {
    let successResolve;
    let failureResolve;
    const promise = new Promise((fulfill, reject) => {
      successResolve = fulfill;
      failureResolve = reject;
    });

    return { promise, reject: failureResolve, resolve: successResolve };
  }

  abstractedValidator(params = []) {
    const response = {};
    let validationPassing = true; // optimism.
    const questions = [];

    params.forEach((param) => {
      if (param.field && _.trim(param.field) !== '') {
        response[param.name] = _.trim(param.field);
      } else if (this.interactive) {
        questions.push({ type: param.type, name: param.name, message: param.question });
      } else {
        validationPassing = false;
      }
    });

    return new Promise((resolve, reject) => {
      if (this.interactive) {
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

  deleteSession() {
    return this._deleteSessonFile().then(() => {
      if (this.interactive) this.logger.info('PubNub Session Deleted');
    });
  }

  _fetchSessionFile() {
    return new Promise((resolve) => {
      fs.readFile(this.sessionStorage, 'utf8', (err, data) => {
        if (err) this.logger.error(err);
        resolve(data);
      });
    });
  }

  _createSessionFile(sessionToken) {
    return this._deleteSessonFile().then(() => {
      return new Promise((resolve) => {
        fs.writeFile(this.sessionStorage, sessionToken, (err) => {
          if (err) this.logger.error(err);
          resolve();
        });
      });
    });
  }

  _deleteSessonFile() {
    return new Promise((resolve) => {
      fs.unlink(this.sessionStorage, (err) => {
        // silence file not found
        if (err && err.code !== 'ENOENT') this.logger.error(err);
        resolve();
      });
    });
  }

}
