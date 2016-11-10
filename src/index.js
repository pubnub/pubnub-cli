import winston from 'winston';

import Networking from './networking';

import SessionComponent from './components/session';
import InitComponent from './components/init';

export default class {

  constructor(isCLI = false) {
    this.logger = new (winston.Logger)({
      transports: [
        new (winston.transports.Console)()
      ]
    });

    this.networking = new Networking({ endpoint: 'https://admin.pubnub.com', logger: this.logger });

    this.initComponent = new InitComponent({ networking: this.networking, logger: this.logger, interactive: isCLI });
    this.sessionComponent = new SessionComponent({ networking: this.networking, logger: this.logger, interactive: isCLI });

    this.init = {
      block: this.initComponent.createBlock.bind(this.initComponent)
    };

    this.session = {
      check: this.sessionComponent.checkSession.bind(this.sessionComponent),
      create: this.sessionComponent.createSession.bind(this.sessionComponent),
      delete: this.sessionComponent.deleteSession.bind(this.sessionComponent)
    };
  }
}
