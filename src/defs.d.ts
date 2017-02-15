import {Question} from "inquirer";

export interface PNQuestion extends Question {
    field: string;
}

// networking
export type errorPayload = {
    statusCode: number,
    message: string,
    errorCode: string,
};

export declare type getAppsRequest = { ownerId?: number, sessionToken?: string };
export declare type getAppsResponse = {sessionToken: string, userId: number};
export declare type getAppsHandler = (err: errorPayload, response?: getAppsResponse) => void;
