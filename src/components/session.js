import os from 'os';
import fs from 'fs';

export default class {

  constructor({ logger, networking }) {
    this.logger = logger;
    this.networking = networking;
    this.sessionStorage = os.homedir() + '/.pubnub-cli';
  }

  deleteSession() {
    return this._deleteSessonFile().then(() => {
      this.logger.info('PubNub Session Deleted');
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
