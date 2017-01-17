
import winston from 'winston';
import fs from 'fs';
import path from 'path';
import esprima from 'esprima';

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

    this.validate = ({ folderPath }) => {
      const sourceCodeFolder = path.join(folderPath, 'src');
      let sourceFolderContents = [];

      try {
        sourceFolderContents = fs.readdirSync(sourceCodeFolder);
      } catch (e) {
        this.logger.error('failed to read source folder', e);
        return;
      }

      sourceFolderContents.forEach((sourceFile) => {
        // skip if it's not a javascript file.
        const sourceCodeLocation = path.join(sourceCodeFolder, sourceFile);
        if (path.extname(sourceCodeLocation) === '.js') {
          const sourceCodeContents = fs.readFileSync(sourceCodeLocation, 'UTF-8');

          try {
            esprima.parse(sourceCodeContents, { sourceType: 'module' });
            this.logger.info(sourceFile + ' is valid');
          } catch (e) {
            this.logger.error(sourceFile + ' is invalid', e);
          }
        }
      });
    };

  }
}
