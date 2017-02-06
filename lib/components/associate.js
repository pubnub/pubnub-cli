System.register([], function (exports_1, context_1) {
    "use strict";
    var __moduleName = context_1 && context_1.id;
    var AssociateComponent;
    return {
        setters: [],
        execute: function () {
            AssociateComponent = class AssociateComponent {
                constructor({ logger, networking, sessionComponent, interactive = false }) {
                    this.logger = logger;
                    this.networking = networking;
                    this.sessionComponent = sessionComponent;
                    this.interactive = interactive;
                }
                perform({ folderPath }) {
                    if (!this.interactive) {
                        this.logger.error('#createBlock not supported for non-interactive mode');
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
            };
            exports_1("default", AssociateComponent);
        }
    };
});
//# sourceMappingURL=associate.js.map