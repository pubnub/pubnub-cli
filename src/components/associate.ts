import Networking from "../networking";
import SessionComponent from "./session";

type constructor = { logger: any, networking: Networking, interactive: boolean, sessionComponent: SessionComponent };
type performRequest = { folderPath: string };

export default class AssociateComponent {

  logger: any;
  networking: Networking;
  sessionComponent: SessionComponent;
  interactive: boolean;

  constructor({ logger, networking, sessionComponent, interactive = false }: constructor) {
    this.logger = logger;
    this.networking = networking;
    this.sessionComponent = sessionComponent;
    this.interactive = interactive;
  }

  perform({ folderPath }: performRequest) {
    // disable this method for non interactive use.
    if (!this.interactive) {
      this.logger.error("#createBlock not supported for non-interactive mode");
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
      });
  }
}
