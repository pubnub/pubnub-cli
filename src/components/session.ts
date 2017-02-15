import colors from "colors";
import fs from "fs";
import _ from "lodash";
import os from "os";
import Networking from "../networking";
import { abstractedValidator, createPromise } from "../utils";

type constructor = { logger: any, networking: Networking, interactive: boolean };

interface IUserSession {
    userId?: number;
    sessionToken?: string;
}

interface ISessionValid {
    sessionValid: boolean;
}

interface ISession {
    email?: string;
    password?: string;
}

export default class SessionComponent {

  logger: any;
  networking: Networking;
  sessionStorage: string;
  interactive: boolean;

  constructor({ logger, networking, interactive = false }: constructor) {
    this.logger = logger;
    this.networking = networking;
    this.sessionStorage = os.homedir() + "/.pubnub-cli";
    this.interactive = interactive;
  }

  checkSession({ userId, sessionToken }: IUserSession = {}) {
    const abstractedPromise = createPromise();

    // abstract CLI // API
    new Promise((fulfill) => {
      if (this.interactive) {
        this._fetchSessionFile()
          .then((credentials) => { fulfill(credentials); })
          .catch((error) => {
            this.logger.info("Session does not exist; credentials found failed to load", error);
            return;
          });
      } else {
        fulfill({ userId, sessionToken });
      }
    }).then((credentials: IUserSession) => {
      this.networking.getApps({ sessionToken: credentials.sessionToken, ownerId: credentials.userId }, (err, result) => {
        // mask the error by checking the status code.
        if (this.interactive) {
          if (result) this.logger.info(colors.green("session is valid"));
          else this.logger.info(colors.red("session is invalid"));
        }

        abstractedPromise.resolve({ sessionValid: result !== undefined, sessionToken: credentials.sessionToken, userId: credentials.userId });
      });
    }).catch((error) => {
      if (this.interactive) this.logger.error(error);
      return abstractedPromise.reject(error);
    });

    return abstractedPromise.promise;
  }

  validateOrCreateSession() {
    const abstractedPromise = createPromise();

    this.checkSession()
      .then((result: ISessionValid) => {
        if (result.sessionValid) {
          abstractedPromise.resolve(_.pick(result, "sessionToken", "ownerId"));
        } else {
          this.createSession()
            .then((response) => {
              abstractedPromise.resolve(_.pick(response, "sessionToken", "ownerId"));
            })
            .catch((err) => {
              abstractedPromise.reject(err);
            });
        }
      })
      .catch((error) => {
        this.logger.error(error);
        abstractedPromise.reject(error);
      });


    return abstractedPromise.promise;
  }

    createSession({ email, password }: ISession = {}) {
    const abstractedPromise = createPromise();
    const inputParams = [
      {
        field: email,
        name: "email",
        question: "Please enter your PubNub email",
        type: "input",
      },
      {
        field: password,
        name: "password",
        question: "Please enter your PubNub password",
        type: "password",
      },
    ];

    abstractedValidator(inputParams, this.interactive).then((fields: ISession) => {
      this.networking.createLoginToken({ email: fields.email, password: fields.password }, (err: any, serverResponse: any) => {
        if (err) {
          if (this.interactive) this.logger.error(err);
          return abstractedPromise.reject(err);
        }

        const userId = serverResponse.result.user_id;
        const sessionToken = serverResponse.result.token;

        if (this.interactive) {
          this.createSessionFile({ userId, sessionToken }).then(() => {
            this.logger.info("Login Succesful, token: " + sessionToken + " saved to home directory");
          });
        }

        abstractedPromise.resolve({ sessionToken, userId });
      });
    }).catch((err) => {
      if (this.interactive) this.logger.error(err);
      return abstractedPromise.reject(err);
    });

    return abstractedPromise.promise;
  }

  deleteSession() {
    return this.deleteSessionFile().then(() => {
      if (this.interactive) this.logger.info("PubNub Session Deleted");
    });
  }

  _fetchSessionFile() {
    return new Promise((resolve) => {
      fs.readFile(this.sessionStorage, "utf8", (err, data) => {
        if (err) resolve({}); else resolve(JSON.parse(data));
      });
    });
  }

  private createSessionFile({ sessionToken, userId }: IUserSession) {
    return this.deleteSessionFile().then(() => {
      return new Promise((resolve, reject) => {
        fs.writeFile(this.sessionStorage, JSON.stringify({ sessionToken, userId }), (err) => {
          if (err) reject(err); else resolve();
        });
      });
    });
  }

  private deleteSessionFile() {
    return new Promise((resolve, reject) => {
      fs.unlink(this.sessionStorage, (err) => {
        // silence file not found
        if (err && err.code !== "ENOENT") reject(err); else resolve();
      });
    });
  }

}
