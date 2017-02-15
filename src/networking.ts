import * as _ from "lodash";
import * as request from "request";
import {errorPayload, getAppsHandler, getAppsRequest} from "./defs";

type constructor = { endpoint: any, logger: any };
type getBlocksRequest = { keyId?: number, sessionToken?: string };
type startBlockRequest = { keyId?: number, blockId?: number, sessionToken?: string };
type stopBlockRequest = { keyId?: number, blockId?: number, sessionToken?: string };
type createBlockRequest = { keyId?: number, blockPayload?: any, sessionToken?: string };
type updateBlockRequest = { keyId?: number, blockPayload?: any, sessionToken?: string, blockId?: number };

type createEventHandlerRequest = { keyId?: number, sessionToken?: string, eventHandlerPayload?: any };
type updateEventHandlerRequest = { keyId?: number, sessionToken?: string, eventHandlerPayload?: any, eventHandlerId?: number };

type createTokenRequest = { email: string, password: string };


export default class Networking {

   logger: any;
   endpoint: any;

  constructor({ endpoint, logger }: constructor) {
    this.logger = logger;
    this.endpoint = endpoint;
  }

  request(method: string, url: string[], opts: any , callback: Function) {
    opts = opts || {};

    opts.url = this.endpoint + "/" + url.join("/");
    opts.method = method;

    opts.json = true;
    opts.headers = opts.headers || {};

    request(opts, (err: any, response: any, body: any) => {
      if (response.statusCode !== 200 || err) {
        this.logger.error("HTTP Request Failed", { method, url, opts, err, response: _.pick(response, "end"), body });
        callback(Networking.prepareErrorResponse({ err, response, body }));
      } else {
        this.logger.debug("HTTP Request Successful", { method, url, opts, err, response });
        callback(null, body);
      }
    });
  }

  getApps({ ownerId , sessionToken }: getAppsRequest, callback: getAppsHandler) {
    if (!ownerId) return callback(Networking.createValidationError("missing ownerId"));
    if (!sessionToken) return callback(Networking.createValidationError("missing sessionToken"));

    const opts = { qs: { owner_id: ownerId }, headers: { "X-Session-Token": sessionToken } };
    this.request("get", ["api", "apps"], opts, callback);
  }

  getBlocks({ keyId, sessionToken }: getBlocksRequest, callback: Function) {
    if (!keyId) return callback("missing keyId");
    if (!sessionToken) return callback("missing sessionToken");

    const opts = { headers: { "X-Session-Token": sessionToken } };
    this.request("get", ["api", "v1", "blocks", "key", keyId.toString(), "block"], opts, callback);
  }

  startBlock({ keyId, blockId, sessionToken }: startBlockRequest, callback: Function) {
    if (!keyId) return callback("missing keyId");
    if (!blockId) return callback("missing blockId");
    if (!sessionToken) return callback("missing sessionToken");

    const opts = { headers: { "X-Session-Token": sessionToken } };
    this.request("post", ["api", "v1", "blocks", "key", keyId.toString(), "block", blockId.toString(), "start"], opts, callback);
  }

  stopBlock({ keyId, blockId, sessionToken }: stopBlockRequest, callback: Function) {
    if (!keyId) return callback("missing keyId");
    if (!blockId) return callback("missing blockId");
    if (!sessionToken) return callback("missing sessionToken");

    const opts = { headers: { "X-Session-Token": sessionToken } };
    this.request("post", ["api", "v1", "blocks", "key", keyId.toString(), "block", blockId.toString(), "stop"], opts, callback);
  }

  createBlock({ keyId, blockPayload, sessionToken }: createBlockRequest, callback: Function) {
    if (!keyId) return callback("missing keyId");
    if (!blockPayload) return callback("missing blockPayload");
    if (!sessionToken) return callback("missing sessionToken");

    const opts = { form: blockPayload, headers: { "X-Session-Token": sessionToken } };
    this.request("post", ["api", "v1", "blocks", "key", keyId.toString(), "block"], opts, callback);
  }

  updateBlock({ keyId, blockId, blockPayload, sessionToken}: updateBlockRequest, callback: Function) {
    if (!keyId) return callback("missing keyId");
    if (!blockId) return callback("missing blockId");
    if (!blockPayload) return callback("missing blockPayload");
    if (!sessionToken) return callback("missing sessionToken");

    const opts = { form: blockPayload, headers: { "X-Session-Token": sessionToken } };
    this.request("put", ["api", "v1", "blocks", "key", keyId.toString(), "block", blockId.toString()], opts, callback);
  }

  createEventHandler({ keyId, eventHandlerPayload, sessionToken }: createEventHandlerRequest, callback: Function) {
    if (!keyId) return callback("missing keyId");
    if (!eventHandlerPayload) return callback("missing eventHandlerPayload");
    if (!sessionToken) return callback("missing sessionToken");

    const opts = { form: eventHandlerPayload, headers: { "X-Session-Token": sessionToken } };
    this.request("post", ["api", "v1", "blocks", "key", keyId.toString(), "event_handler"], opts, callback);
  }

  updateEventHandler({ keyId, eventHandlerId, eventHandlerPayload, sessionToken }: updateEventHandlerRequest , callback: Function) {
    if (!keyId) return callback("missing keyId");
    if (!eventHandlerId) return callback("missing eventHandlerId");
    if (!eventHandlerPayload) return callback("missing eventHandlerPayload");
    if (!sessionToken) return callback("missing sessionToken");

    const opts = { form: eventHandlerPayload, headers: { "X-Session-Token": sessionToken } };
    this.request("put", ["api", "v1", "blocks", "key", keyId.toString(), "event_handler", eventHandlerId.toString()], opts, callback);
  }

  createLoginToken({ email, password }: createTokenRequest, callback: Function) {
    if (!email) return callback("missing email");
    if (!password) return callback("missing password");

    const opts = { form: { email, password } };
    this.request("post", ["api", "me"], opts, callback);
  }

  private static createValidationError(text: string): errorPayload {
    return {
        statusCode: null,
        message: text,
        errorCode: null,
      };
  }

  private static prepareErrorResponse({ err, response, body }: any): errorPayload  {
    const constructedError: errorPayload = {
      statusCode: null,
      message: null,
      errorCode: null,
    };

    if (response && response.statusCode) {
      constructedError.statusCode = response.statusCode;
    }

    if (body) {
      if (body.error) constructedError.message = body.error;
      if (body.error_code) constructedError.errorCode = body.error_code;
    } else {
      constructedError.message = err;
    }

    return constructedError;
  }
}
