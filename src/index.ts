
import winston from 'winston';
import fs from 'fs';
import path from 'path';
import esprima from 'esprima';

import Networking from './networking';

import SessionComponent from './components/session';
import InitComponent from './components/init';
import AssociateComponent from './components/associate';

type entryPointDef = { isCLI: boolean };

export default class {

  private logger: any;
  private networking: Networking;

  validate: Function;

  init: InitComponent;
  associate: AssociateComponent;
  session: SessionComponent;

  constructor({ isCLI = false } : entryPointDef) {
    this.logger = new (winston.Logger)({
      transports: [
        new (winston.transports.Console)()
      ]
    });

    this.networking = new Networking({ endpoint: 'https://admin.pubnub.com', logger: this.logger });

    this.init = new InitComponent({ networking: this.networking, logger: this.logger, interactive: isCLI });
    this.session = new SessionComponent({ networking: this.networking, logger: this.logger, interactive: isCLI });
    this.associate = new AssociateComponent({ networking: this.networking, sessionComponent: this.session, logger: this.logger, interactive: isCLI });



    this.validate = ({ folderPath }: {folderPath: string}) => {
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
          const sourceCodeContents: Buffer = fs.readFileSync(sourceCodeLocation);

          try {
            esprima.parse(sourceCodeContents.toString('UTF-8'), { sourceType: 'module' });
            this.logger.info(sourceFile + ' is valid');
          } catch (e) {
            this.logger.error(sourceFile + ' is invalid', e);
          }
        }
      });
    };

  }
}
