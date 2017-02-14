"use strict";
const esprima = require("esprima");
const fs = require("fs");
const path = require("path");
const winston = require("winston");
const associate_1 = require("./components/associate");
const init_1 = require("./components/init");
const session_1 = require("./components/session");
const networking_1 = require("./networking");
;
class default_1 {
    constructor({ isCLI = false }) {
        this.logger = new (winston.Logger)({
            transports: [
                new (winston.transports.Console)(),
            ],
        });
        this.networking = new networking_1.default({ endpoint: "https://admin.pubnub.com", logger: this.logger });
        this.init = new init_1.default({ networking: this.networking, logger: this.logger, interactive: isCLI });
        this.session = new session_1.default({ networking: this.networking, logger: this.logger, interactive: isCLI });
        this.associate = new associate_1.default({
            interactive: isCLI,
            logger: this.logger,
            networking: this.networking,
            sessionComponent: this.session,
        });
        this.validate = ({ folderPath }) => {
            const sourceCodeFolder = path.join(folderPath, "src");
            let sourceFolderContents = [];
            try {
                sourceFolderContents = fs.readdirSync(sourceCodeFolder);
            }
            catch (e) {
                this.logger.error("failed to read source folder", e);
                return;
            }
            sourceFolderContents.forEach((sourceFile) => {
                const sourceCodeLocation = path.join(sourceCodeFolder, sourceFile);
                if (path.extname(sourceCodeLocation) === ".js") {
                    const sourceCodeContents = fs.readFileSync(sourceCodeLocation);
                    try {
                        esprima.parse(sourceCodeContents.toString("UTF-8"), { sourceType: "module" });
                        this.logger.info(sourceFile + " is valid");
                    }
                    catch (e) {
                        this.logger.error(sourceFile + " is invalid", e);
                    }
                }
            });
        };
    }
}
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = default_1;
