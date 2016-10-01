const winston = require('winston');

export default class {

  constructor({ logLevel }) {
    this.logger = new winston.Logger({
      level: logLevel || 'error'
    });

    this.logger.add(winston.transports.Console, {
      prettyPrint: true,
      colorize: true,
      silent: false,
      timestamp: false
    });

  }

  /*
    logger methods to abstract out networking.
  */
  logPendingNetworkEvent(data) {
    data.state = 'pending';
    this.logger.debug(data);
  }

  logFailedNetworkEvent(data) {
    data.state = 'failed';
    this.logger.debug(data);
  }

  logSuccessfulNetworkEvent(data) {
    data.state = 'success';
    this.logger.debug(data);
  }

}
