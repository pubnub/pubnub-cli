import API from "./api";
import {CreateSessionTokenResponse} from "./api";
import Files from "./files";

import * as path from "path";
import * as os from "os";

interface SessionParameters {
    email: string;
    password: string;
}

const prompt = (questions: any[]): Promise<Object> => { //TODO: validator
    return Promise.resolve({});
};


class SessionComponent {
    private _sessionFilePath: string;

    constructor(){
        this._sessionFilePath = path.join(os.homedir(), ".config", "pubnub", "session.json");
    }

    create({ email, password }: SessionParameters) {
        prompt([]) // TODO
            .then(() => {
                API.createSessionToken({ email, password }).then((body) => {
                    console.log("Success!", body);
                    return body
                }).then((response: CreateSessionTokenResponse) => {
                    console.log("Response:", response);
                    this.saveSessionToFile(response);
                })
            }).catch((error) => {
                console.log("Error innny", error)
            })
   }

    loadSessionFromFile(): CreateSessionTokenResponse {
        console.log("Loading session...");
        const content = Files.readJsonFile<CreateSessionTokenResponse>(this._sessionFilePath).valueOrThrow(new Error("Session file couldn't be read. Please run pubnub-cli session create"));
        return content
    }

    private saveSessionToFile(response: CreateSessionTokenResponse) {
        Files.writeJsonToFile(this._sessionFilePath, response)
    }
}

const sessionComponent = new SessionComponent;
export default sessionComponent;
