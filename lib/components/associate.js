"use strict";
class AssociateComponent {
    constructor({ logger, networking, sessionComponent, interactive = false }) {
        this.logger = logger;
        this.networking = networking;
        this.sessionComponent = sessionComponent;
        this.interactive = interactive;
    }
    perform({ folderPath }) {
        if (!this.interactive) {
            this.logger.error("#createBlock not supported for non-interactive mode");
            return;
        }
        this.sessionComponent.validateOrCreateSession()
            .then((response) => {
            console.log(response);
        })
            .catch((error) => {
            console.log(error);
        });
    }
}
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = AssociateComponent;
