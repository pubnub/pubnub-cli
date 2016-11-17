export default class {

  constructor({ logger, networking, sessionComponent, interactive = false }) {
    this.logger = logger;
    this.networking = networking;
    this.sessionComponent = sessionComponent;
    this.interactive = interactive;
  }

  perform() {
    // disable this method for non interactive use.
    if (!this.interactive) {
      this.logger.error('#createBlock not supported for non-interactive mode');
      return;
    }

    this.sessionComponent.validateOrCreateSession()
      .then((response) => {
        console.log(response);
        // start querying here.
      })
      .catch((error) => {
        console.log(error);
        // catch here
      })
  }
}
