
import program from 'commander';
import winston from 'winston';

import Networking from './networking';

import SessionComponent from './components/session';

import packageInfo from '../package.json';

const logger = new (winston.Logger)({
  transports: [
    new (winston.transports.Console)()
  ]
});

// initialize modules
const networking = new Networking({ endpoint: 'https://admin.pubnub.com', logger });

// initialize components
const sessionComponent = new SessionComponent({ networking, logger });

sessionComponent._createSessionFile('max');

program
  .version(packageInfo.version)
  .parse(process.argv);
