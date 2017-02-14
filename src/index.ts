import * as esprima from "esprima";
import * as fs from "fs";
import * as path from "path";
import * as winston from "winston";
import AssociateComponent from "./components/associate";
import InitComponent from "./components/init";
import SessionComponent from "./components/session";
import Networking from "./networking";

interface IentryPointDef {
    isCLI: boolean;
};

export default class {
  public validate: Function;
  public init: InitComponent;
  public associate: AssociateComponent;
  public session: SessionComponent;

  private logger: any;
  private networking: Networking;

  constructor({ isCLI = false }: IentryPointDef) {
    this.logger = new (winston.Logger)({
      transports: [
        new (winston.transports.Console)(),
      ],
    });

    this.networking = new Networking({ endpoint: "https://admin.pubnub.com", logger: this.logger });

    this.init = new InitComponent({ networking: this.networking, logger: this.logger, interactive: isCLI });
    this.session = new SessionComponent({ networking: this.networking, logger: this.logger, interactive: isCLI });
    this.associate = new AssociateComponent({
      interactive: isCLI,
      logger: this.logger,
      networking: this.networking,
      sessionComponent: this.session,
    });

    this.validate = ({ folderPath }: {folderPath: string}) => {
      const sourceCodeFolder = path.join(folderPath, "src");
      let sourceFolderContents = [];

      try {
        sourceFolderContents = fs.readdirSync(sourceCodeFolder);
      } catch (e) {
        this.logger.error("failed to read source folder", e);
        return;
      }

      sourceFolderContents.forEach((sourceFile) => {
        // skip if it's not a javascript file.
        const sourceCodeLocation = path.join(sourceCodeFolder, sourceFile);
        if (path.extname(sourceCodeLocation) === ".js") {
          const sourceCodeContents: Buffer = fs.readFileSync(sourceCodeLocation);

          try {
            esprima.parse(sourceCodeContents.toString("UTF-8"), { sourceType: "module" });
            this.logger.info(sourceFile + " is valid");
          } catch (e) {
            this.logger.error(sourceFile + " is invalid", e);
          }
        }
      });
    };

  }
}
