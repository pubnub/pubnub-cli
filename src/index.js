import winston from 'winston';

import Networking from './networking';

import SessionComponent from './components/session';
import InitComponent from './components/init';
import AssociateComponent from './components/associate';

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
    this.associateComponent = new AssociateComponent({ networking: this.networking, sessionComponent: this.sessionComponent, logger: this.logger, interactive: isCLI });

    this.associate = this.associateComponent.perform.bind(this.associateComponent);

    this.init = {
      block: this.initComponent.createBlock.bind(this.initComponent),
      handler: this.initComponent.createEventHandler.bind(this.initComponent)
    };

    this.session = {
      check: this.sessionComponent.checkSession.bind(this.sessionComponent),
      create: this.sessionComponent.createSession.bind(this.sessionComponent),
      delete: this.sessionComponent.deleteSession.bind(this.sessionComponent)
    };
  }
}
