import os from 'os';
import fs from 'fs';
import colors from 'colors/safe';
import { createPromise, abstractedValidator } from '../utils';

export default class {

  constructor({ logger, networking, interactive = false }) {
    this.logger = logger;
    this.networking = networking;
    this.sessionStorage = os.homedir() + '/.pubnub-cli';
    this.interactive = interactive;
  }

  checkSession({ userId, sessionToken } = {}) {
    const abstractedPromise = createPromise();

    // abstract CLI // API
    new Promise((fulfill) => {
      if (this.interactive) {
        this._fetchSessionFile()
          .then((credentials) => { fulfill(credentials); })
          .catch((error) => {
            this.logger.info('Session does not exist; credentials found failed to load', error);
            return;
          });
      } else {
        fulfill({ userId, sessionToken });
      }
    }).then((credentials) => {
      this.networking.getApps({ sessionToken: credentials.sessionToken, ownerId: credentials.userId }, (err, result) => {
        // mask the error by checking the status code.
        if (this.interactive) {
          if (result) this.logger.info(colors.green('session is valid'));
          else this.logger.info(colors.red('session is invalid'));
        } else {
          abstractedPromise.resolve({ sessionValid: result !== undefined });
        }
      });
    }).catch((error) => {
      if (this.interactive) this.logger.error(error);
      else abstractedPromise.reject(error);
    });

    return abstractedPromise;
  }

  createSession({ email, password }) {
    const abstractedPromise = createPromise();
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

    abstractedValidator(inputParams, this.interactive).then((fields) => {
      this.networking.createLoginToken({ email: fields.email, password: fields.password }, (err, serverResponse) => {
        if (err) {
          if (this.interactive) this.logger.error(err);
          else abstractedPromise.reject(err);
          return;
        }

        const userId = serverResponse.result.user_id;
        const sessionToken = serverResponse.result.token;

        if (this.interactive) {
          this._createSessionFile({ userId, sessionToken }).then(() => {
            this.logger.info('Login Succesful, token: ' + sessionToken + ' saved to home directory');
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

  deleteSession() {
    return this._deleteSessonFile().then(() => {
      if (this.interactive) this.logger.info('PubNub Session Deleted');
    });
  }

  _fetchSessionFile() {
    return new Promise((resolve) => {
      fs.readFile(this.sessionStorage, 'utf8', (err, data) => {
        if (err) resolve({}); else resolve(JSON.parse(data));
      });
    });
  }

  _createSessionFile({ sessionToken, userId }) {
    return this._deleteSessonFile().then(() => {
      return new Promise((resolve, reject) => {
        fs.writeFile(this.sessionStorage, JSON.stringify({ sessionToken, userId }), (err) => {
          if (err) reject(err); else resolve();
        });
      });
    });
  }

  _deleteSessonFile() {
    return new Promise((resolve, reject) => {
      fs.unlink(this.sessionStorage, (err) => {
        // silence file not found
        if (err && err.code !== 'ENOENT') reject(err); else resolve();
      });
    });
  }

}
