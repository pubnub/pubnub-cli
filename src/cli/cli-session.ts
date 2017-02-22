#!/usr/bin/env node

import * as program from "commander";
import Session from "../components/session";
import Files from "../components/files"
import API from "../components/api";
const { version } = require("../../package.json");

const handleCreate = (email: string, password: string) => {
    console.log(`create called with email "${email}" and password "${password}"`);
    Session.create({ email, password })
};

const handleDelete = () => {
    console.log("Removing session...");
    Files.removeSessionFile();
    console.log("Removed!");
};

const handleCheck = () => {
    console.log("Checking session...");
    //TODO: Handle lack of file nicer than throwing error
    API.getApps({}).then((response) => {
        console.log("Session valid!");
    }).catch((_error) => {
        console.log("Invalid session. Create new session with `pubnub-cli session create`")
    });
};

program
    .version(version);

program
    .command("create <email> <password>")
    .description("create session: email & password is optional and can be supplied in runtime.")
    .action(handleCreate);

program
    .command("delete")
    .description("deletes existing session.")
    .action(handleDelete);

program
    .command("check")
    .description("checks is session exists and if it's valid.")
    .action(handleCheck);

program
    .parse(process.argv);
