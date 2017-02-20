import * as request from "request";

import Session from "./session"

interface CreateSessionTokenParameters {
    email: string;
    password: string;
}

interface ApiError {
    code: number;
    error: string;
    error_code: string;
}

type GetAppsResponse = any;
type GetBlocksResponse = any;
type StartBlockResponse = any;
type StopBlockResponse = any;
type CreateBlockResponse = any;
export type CreateSessionTokenResponse = any;
// interface CreateSessionTokenResponse {
//
// }

interface Options {
    form?: any;
    path: string;
    method?: string;
    qs?: any;
}

interface GetAppsParameters {
    ownerId?: string;
}

interface GetBlocksParameters {
    keyId: number
}

interface StartBlockParameters {
    keyId: number,
    blockId: number
}

interface CreateBlockParameters {
    key_id: number
}

type StopBlockParameters = StartBlockParameters;

export class API {
    private _endpoint: string;
    private _sessionJson: CreateSessionTokenResponse;

    get session() {
        return this._sessionJson || (this._sessionJson = (Session.loadSessionFromFile()));
    }

    get currentUserId(){
        return this.session.result && this.session.result.user_id;
    }

    get sessionToken() {
        return this.session.result && this.session.result.token;
    }

    constructor() {
        this._endpoint = "https://admin.pubnub.com";
    }

    public createSessionToken({ email, password }: CreateSessionTokenParameters): Promise<CreateSessionTokenResponse> {
        return this.makeRequest({
                path: "/api/me",
                method: "POST",
                form: { email, password }
            })
    }

    public getApps({ ownerId = this.currentUserId }: GetAppsParameters): Promise<GetAppsResponse> {
        return this.makeRequest({
            path: "/api/apps",
            qs: { owner_id: ownerId }
        })
    }

    public getBlocks({ keyId }: GetBlocksParameters): Promise<GetBlocksResponse> {
        return this.makeRequest({
            path: `/api/v1/blocks/key/${keyId}/block`
        });
    }

    public startBlock({keyId, blockId }: StartBlockParameters): Promise<StartBlockResponse> {
        return this.makeRequest({
            method: "POST",
            path: `/api/v1/blocks/key/${keyId}/block/${blockId}/start`
        })
    }

    public stopBlock({keyId, blockId }: StopBlockParameters): Promise<StopBlockResponse> {
        return this.makeRequest({
            method: "POST",
            path: `/api/v1/blocks/key/${keyId}/block/${blockId}/stop`
        })
    }

    public createBlock(blockData: CreateBlockParameters): Promise<CreateBlockResponse> {
        console.log(blockData);
        return this.makeRequest({
            method: "POST",
            path: `/api/v1/blocks/key/${blockData.key_id}/block`,
            form: blockData
        })
    }

    private makeRequest<Response>({method = "GET", path, qs, form}: Options): Promise<Response> {
        return new Promise((resolve, reject) => {
            request({
                url: this._endpoint + path,
                method: method,
                json: true,
                form: form,
                qs: qs,
                headers: (path != "/api/me") && this.sessionToken && { "X-Session-Token": this.sessionToken }
            }, (error: any, response: any, body: any) => {
                if (response.statusCode !== 200 || error) {
                    //TODO this.logger.error("HTTP Request Failed", { method, url, opts, err, response: _.pick(response, "end"), body });
                    console.log("HTTP Request Failed");
                    reject(body); // TODO: callback(Networking.prepareErrorResponse({ err, response, body }));
                } else {
                    //TODO this.logger.debug("HTTP Request Successful", { method, url, opts, err, response });
                    resolve(body);
                }
            })
        })
    }
}

const apiInstance = new API();
export default apiInstance;