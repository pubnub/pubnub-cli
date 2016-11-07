import os from 'os';
import fs from 'fs';

export default class {

  constructor({ logger, networking, interactive = false }) {
    this.logger = logger;
    this.networking = networking;
    this.sessionStorage = os.homedir() + '/.pubnub-cli';
    this.interactive = interactive;
  }

  createSession({ username, password }) {
    return new Promise((resolve) => {
      resolve({ username, password });
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
        if (err) this.logger.error(err);
        resolve();
      });
    });
  }

}
