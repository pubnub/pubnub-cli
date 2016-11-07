import winston from 'winston';

import Networking from './networking';

import SessionComponent from './components/session';

export default class {

  constructor(isCLI = false) {
    this.logger = new (winston.Logger)({
      transports: [
        new (winston.transports.Console)()
      ]
    });

    this.networking = new Networking({ endpoint: 'https://admin.pubnub.com', logger: this.logger });

    this.sessionComponent = new SessionComponent({ networking: this.networking, logger: this.logger, interactive: isCLI });

    this.session = {
      create: this.sessionComponent.createSession.bind(this.sessionComponent),
      delete: this.sessionComponent.deleteSession.bind(this.sessionComponent)
    };
  }
}
